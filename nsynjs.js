//"use strict";

/**
 * nsynjs
 * @module nsynjs
 * @author Alexei Maximov amaksr
 * @licence AGPLv3
 * @version 0.1.3
 */
(function(exports){
    if(!exports.console)
        exports.console = {error: function () {}, log: function () {}};

    var dbg=console.log;

    // Array.prototype.last = function() {
    //     return this[this.length-1];
    // };
    var arrayLast = function (arr) {
        return arr[arr.length-1];
    };

    var Syn = {};
    Syn.states = Syn.states || {};
    Syn.stateSeq = 0;

    Syn.exists = function(state) {
        return !!Syn.states[state.id];
    };

    Syn.isRunning = function(state) {
        return this.exists(state) && !!state.finCb;
    };

    var State = function(id, nsynjsBin, userThisCtx, finCb, params, parent, callerState) {
        this.id = id;
        this.t = 'State';
        this.nsynjsBin = nsynjsBin;
        this.userThisCtx = userThisCtx;
        this.finCb = finCb || function () {};
        this.params = params;
        this.stack = [];
        this.localVars = {};
        this.buf = null;
        this.curCalledState = this;
        this.parent = parent;
        this.callerState = callerState;
        if(!callerState) {
            this.tick = State.tick;
            this.rootState = this;
        }
        else {
            this.rootState = callerState.rootState;
        }
        this.destructor = null;
        for(var i=0; i<nsynjsBin.params.children().length; i++)
            this.localVars[nsynjsBin.params.children()[i].value] = params[i];
        for(i in nsynjsBin.funDecls)
            this.localVars[i] = nsynjsBin.funDecls[i].fn;
        this.localVars['nsynjsCtx'] = this;
        this.localVars['arguments'] = params;
    };

    State.prototype.setDestructor = function (destructor) {
        this.destructor = destructor;
    };

    State.prototype.setDoNotWait = function (doNotWait) {
        this.doNotWait = doNotWait;
    };

    State.prototype.resume = function (ex) {
        if(!this.finCb)
            throw new Error("Attempted to call context.resume() on finished context. Is some callback wrapper missing 'nsynjsHasCallback' property?");
        this.destructor = null;
        if(ex)
            this.throwException(ex);
        this.rootState.tick();
    };

    State.prototype.stop = function () {
        throw "Not a root state";
    };

    State.prototype.stop = function () {
        if(this.callerState)
            throw "Not a root state";
        this._stop();
        this.rootState.tick();
    };

    State.prototype._stop = function () {
        if(this.calledState) {
            this.calledState._stop();
            this.calledState = null;
        }
        else if(this.destructor && typeof this.destructor === 'function')
            this.destructor();
        this.stack = [];
        this.finCb = function(){};
    };

    State.prototype.tick = function () {
        throw "Not a root state";
    };

    State.tick = function () {
        while(true) {
            var state = this.curCalledState;
            if(!state)
                break;
            if(!state.stack.length) {
                state.funcFinish();
                state = this;
                continue;
            }
            var stackEl = arrayLast(state.stack);
            try {
                var cont = stackEl.program.executeStep.call(stackEl.program,state,stackEl);
                if(!cont) {
                    return;
                }
            }
            catch (e) {
                console.error(state.formatStackTrace(e));
                state.throwException(e);
            }
        }
    };

    State.prototype.formatStackTrace = function (e) {
        var res = [];
        var state = this;
        do {
            var src = getRootClosure(arrayLast(state.stack).program.clsr).src;
            var name = state.nsynjsBin.name || '<anonymous>';
            var msg = findLine(src,arrayLast(state.stack).program.start);
            if(msg) {
                res.push("nsynjs runtime error at "+name);
                if(state===this) {
                    if(msg.prevLine) res.push((msg.lineNo-1)+'>'+msg.prevLine);
                    res.push(msg.lineNo+'>'+msg.currLine);
                    res.push(msg.lineNo+'>'+msg.carrot+" <<< "+e);
                    if(msg.nextLine) res.push((msg.lineNo+1)+'>'+msg.nextLine);
                }
                else {
                    res.push(msg.lineNo+'>'+msg.currLine);
                    res.push(msg.lineNo+'>'+msg.carrot);
                }
            }
            else
                res.push('Source not available');
        } while (state = state.callerState);
        res.push(e.stack);
        return res.join("\n");
    };

    function formatParseError(src,start,e) {
        var res=[];
        var msg = findLine(src, start);
        if(msg) {
            res.push("nsynjs parse error");
            if (msg.prevLine) res.push((msg.lineNo - 1) + '>' + msg.prevLine);
            res.push(msg.lineNo + '>' + msg.currLine);
            res.push(msg.lineNo + '>' + msg.carrot + " <<< " + e);
            if (msg.nextLine) res.push((msg.lineNo + 1) + '>' + msg.nextLine);
        }
        else
            res.push('Source not available');
        return res.join("\n");
    }

    function getRootClosure(clsr) {
        var s=clsr;
        while(s.clsr)
            s=s.clsr;
        return s;
    };

    State.prototype.funcStart = function (funcPtr, ctx, params, isConstructor) {
        var newState = new State(Syn.stateSeq, funcPtr.nsynjsBin, ctx, null, params, funcPtr.nsynjsBin.clsr, this);
        newState.isConstructor = isConstructor;
        this.calledState = newState;
        this.rootState.curCalledState = newState;
        Syn.states[Syn.stateSeq++] = newState;
        funcPtr.nsynjsBin.operatorBlock.execute(newState);
    };

    State.prototype.funcFinish = function () {
        var cb = this.finCb;
        this.finCb = null;
        delete Syn.states[this.id];
        this.rootState.curCalledState = this.callerState;
        if(this.callerState) {
            this.callerState.buf = new ValRef(this,ValRef.TypeValue,this.isConstructor?this.userThisCtx:this.retVal);
            this.callerState.calledState = null;
        }
        if(this.exception) {
            if(!this.callerState)
                throw this.exception;
            else {
                this.callerState.throwException(this.exception);
            }
        }

        cb.call(this.userThisCtx,this.retVal);
    };

    State.prototype.throwException = function (e) {
        var se;
        while(se=this.stack.pop())
            if(se._try)
                break;
        if(se) {
            se.program.catchBlock.execute(this);
            var f = this.buf.val();

            this.funcStart(f,this.userThisCtx,[e]);
        }
        else
            this.exception = e;
    };

    var StmtIf = function(clsr) {
        this.clsr = clsr;
        this.src = null;
        this.opBodyTrueBin = null;
        this.opBodyFalseBin = null;
    };
    StmtIf.prototype.parse = function (str,idx) {
        this.start = idx;
        idx = ss(str,idx+2);
        if(ch1(str,idx) !==  '(')
            throw "expected  '('";
        idx = ss(str,idx+1);

        this.expr = new Expr(this.clsr);
        idx = this.expr.parse(str,idx);
        idx = ss(str,idx+1);

        this.opBodyTrueBin = stmtDetect(this.clsr,str,idx,true);
        if(this.opBodyTrueBin.labelSkip) idx = this.opBodyTrueBin.labelSkip;
        idx = this.opBodyTrueBin.parse(str,idx);

        idx = skipOptSemicolon(str,idx);

        // optional else
        if(startingWith(str,idx,'else')) {
            idx = ss(str,idx+4);
            this.opBodyFalseBin = stmtDetect(this.clsr, str,idx,true);
            if(this.opBodyFalseBin.labelSkip) idx = this.opBodyFalseBin.labelSkip;
            idx = this.opBodyFalseBin.parse(str,idx);
        }
        this.src = str.substr(this.start,idx-this.start);
        idx = skipOptSemicolon(str,idx);
        return idx;
    };
    StmtIf.prototype.optimize = function() {
        var res=true;
        if(!this.expr.optimize())
            res=false;
        if(!this.opBodyTrueBin.optimize())
            res=false;
        if(this.opBodyFalseBin && !this.opBodyFalseBin.optimize())
            res=false;
        this.qSrc = this.qLbl + "if("+this.expr.qSrc+")"+this.opBodyTrueBin.qSrc;
        if(this.opBodyFalseBin)
            this.qSrc+=" else "+this.opBodyFalseBin.qSrc;
        if(res)
            eval("this.execute = function(state) {"+this.qSrc+"}");
        return res;
    };
    StmtIf.prototype.execute = function(state) {
        state.stack.push({
            program: this
        });
        this.expr.execute(state);
    };
    StmtIf.prototype.executeStep = function (state,stackEl) {
        state.stack.pop();
        var stmt = state.buf.val()?this.opBodyTrueBin:this.opBodyFalseBin;
        if(stmt) stmt.execute(state);
        return true;
    };

    var StmtDoWhile = function(clsr) {
        this.clsr = clsr;
        this.breakable = true;
        this.src = null;
    };
    StmtDoWhile.prototype.parse = function (str,idx) {
        this.start = idx;
        idx = ss(str,idx+2);
        this.opBodyBin = stmtDetect(this.clsr,str,idx,true);
        if(this.opBodyBin.labelSkip) idx = this.opBodyBin.labelSkip;
        idx = this.opBodyBin.parse(str,idx);

        idx = ss(str,idx);
        idx = skipOptSemicolon(str,idx);
        if(!startingWith(str,idx,'while'))
            throw "Expected 'while'";

        idx = ss(str,idx+5);

        if(ch1(str,idx) !=  '(')
            throw "expected  '('";

        idx = ss(str,idx+1);
        this.expr = new Expr(this.clsr);
        idx = this.expr.parse(str,idx);
        idx = ss(str,idx+1);
        this.src = str.substr(this.start,idx-this.start);
        idx = skipOptSemicolon(str,idx);
        return idx;
    };
    StmtDoWhile.prototype.optimize = function() {
        var res=true;
        if(!this.opBodyBin.optimize())
            res=false;
        if(!this.expr.optimize())
            res=false;
        this.qSrc = this.qLbl + this.opBodyBin.qSrc + "while("+this.expr.qSrc+")";
        if(res)
            eval("this.execute = function(state) {"+this.qSrc+"}");
        return res;
    };
    StmtDoWhile.prototype.execute = function(state) {
        var o = {
            nxt: this.executeStepBody,
            program: this
        };
        state.stack.push(o);
    };
    StmtDoWhile.prototype.executeStep = function(state, stackEl) {
        return stackEl.nxt.call(this,state,stackEl);
    };
    StmtDoWhile.prototype.executeStepBody = function(state,stackEl) {
        stackEl.nxt = this.executeStepCond;
        this.opBodyBin.execute(state);
        return true;
    };
    StmtDoWhile.prototype.executeStepCond = function(state,stackEl) {
        stackEl.nxt = this.executeStepCond2;
        this.expr.execute(state);
        return true;
    };
    StmtDoWhile.prototype.executeStepCond2 = function(state,stackEl) {
        stackEl.nxt = this.executeStepBody;
        if(!state.finCb || !state.buf.val())
            state.stack.pop();
        return true;
    };

    var StmtWhile = function(clsr) {
        this.clsr = clsr;
        this.breakable = true;
        this.src = null;
    };
    StmtWhile.prototype.parse = function (str,idx) {
        this.start = idx;
        idx = ss(str,idx+5);
        if(ch1(str,idx) !==  '(')
            throw "expected  '('";
        idx = ss(str,idx+1);

        this.expr = new Expr(this.clsr);
        idx = this.expr.parse(str,idx);

        idx = ss(str,idx+1);

        this.opBodyBin = stmtDetect(this.clsr,str,idx,true);
        if(this.opBodyBin.labelSkip) idx = this.opBodyBin.labelSkip;
        idx = this.opBodyBin.parse(str,idx);

        this.src = str.substr(this.start,idx-this.start);
        idx = skipOptSemicolon(str,idx);
        return idx;
    };
    StmtWhile.prototype.optimize = function() {
        var res=true;
        if(!this.expr.optimize())
            res=false;
        if(!this.opBodyBin.optimize())
            res=false;
        this.qSrc = this.qLbl + "while("+this.expr.qSrc+")"+this.opBodyBin.qSrc;
        if(res)
            eval("this.execute = function(state) {"+this.qSrc+"}");
        return res;
    };
    StmtWhile.prototype.execute = function(state) {
        var o = {
            program: this,
            nxt: this.executeStepCond
        };
        state.stack.push(o);
    };
    StmtWhile.prototype.executeStep = function(state, stackEl) {
        return stackEl.nxt.call(this,state,stackEl);
    };
    StmtWhile.prototype.executeStepCond = function(state,stackEl) {
        stackEl.nxt = this.executeStepCond2;
        this.expr.execute(state);
        return true;
    };
    StmtWhile.prototype.executeStepCond2 = function(state,stackEl) {
        stackEl.nxt = this.executeStepCond;
        if(state.finCb && state.buf.val() )
            this.opBodyBin.execute(state);
        else
            state.stack.pop();
        return true;
    };

    var StmtForIn = function(clsr) {
        this.clsr = clsr;
        this.breakable = true;
        this.src = null;
        this.label = null;
        this.key = null;
        this.inExpr = null;
        this.body = null;
    };
    StmtForIn.prototype.parse = function (str,idx) {
        this.start = idx;
        idx = ss(str,idx+3);
        if(ch1(str,idx) !==  '(')
            throw "expected  '('";
        idx = ss(str,idx+1);
        this.key = new OperandPath(this.clsr,null);
        if(startingWith(str,idx,'var')) {
            this.key.inVar=true;
            idx = ss(str,idx+3);
        }
        idx = this.key.parse(str,idx);
        if(this.key.inVar && this.key.children().length===1 && this.key.children()[0].t==='Lit') {
            this.clsr.varDefs[this.key.children()[0].value] = this.key;
            this.key.children()[0].inVar = true;
        }
        idx=ss(str,idx);
        if(startingWith(str,idx,'in'))
            this.type = 'in';
        else if(startingWith(str,idx,'of'))
            throw "for ... of ... cycle is not supported";
        else
            throw "Expected 'in'";
        idx = ss(str,idx+2);

        this.inExpr = new Expr(this.clsr);
        idx=this.inExpr.parse(str,idx);
        idx = ss(str,idx+1);
        this.body = stmtDetect(this.clsr,str,idx,true);
        if(this.body.labelSkip) idx = this.body.labelSkip;
        idx = this.body.parse(str,idx);
        this.src = str.substr(this.start,idx-this.start);
        idx = skipOptSemicolon(str,idx);
        return idx;
    };
    StmtForIn.prototype.optimize = function() {
        var res=true;
        if(!this.key.optimize())
            res=false;
        if(!this.inExpr.optimize())
            res=false;
        if(!this.body.optimize())
            res=false;
        this.qSrc = this.qLbl + "for("+this.key.qSrc+" in "+this.inExpr.qSrc+")"+this.body.qSrc;
        if(res)
            eval("this.execute = function(state) {"+this.qSrc+"}");
        return res;
    };
    StmtForIn.prototype.execute = function(state) {
        var o = {
            program: this,
            pc: 0,
            nxt: this.executeStepExpr
        };
        state.stack.push(o);
        this.inExpr.execute(state);
    };
    StmtForIn.prototype.executeStep = function(state, stackEl) {
        return stackEl.nxt.call(this,state,stackEl);
    };

    StmtForIn.prototype.executeStepExpr = function(state,stackEl) {
        stackEl.vals = Object.keys(state.buf.val());
        stackEl.nxt = this.executeStepKey;
        return true;
    };
    StmtForIn.prototype.executeStepKey = function(state,stackEl) {
        stackEl.nxt = this.executeStepBody;
        if(stackEl.pc >= stackEl.vals.length) {
            state.stack.pop();
            return true;
        }
        this.key.execute(state);
        return true;
    };
    StmtForIn.prototype.executeStepBody = function(state,stackEl) {
        stackEl.keyRef = state.buf;
        stackEl.keyRef.set(stackEl.vals[stackEl.pc++]);
        this.body.execute(state);
        stackEl.nxt = this.executeStepKey;
        return true;
    };

    var StmtFor = function(clsr) {
        this.clsr = clsr;
        this.breakable = true;
        this.src = null;
        this.label = null;
        this.expr1 = null;
        this.expr2 = null;
        this.expr3 = null;
        this.body = null;
    };
    StmtFor.prototype.parse = function (str,idx) {
        this.start = idx;
        idx = ss(str,idx+3);
        if(ch1(str,idx) !==  '(')
            throw "expected  '('";
        idx = ss(str,idx+1);

        this.expr1 = new Expr(this.clsr);
        if(startingWith(str,idx,'var')){
            idx = ss(str,idx+3);
            this.expr1.inVar = true;
        }
        idx=this.expr1.parse(str,idx);

        idx = ss(str,idx+1);
        this.expr2 = new Expr(this.clsr);
        idx=this.expr2.parse(str,idx);

        idx = ss(str,idx+1);
        this.expr3 = new Expr(this.clsr);
        idx=this.expr3.parse(str,idx);
        idx = ss(str,idx+1);

        this.body = stmtDetect(this.clsr,str,idx,true);
        if(this.body.labelSkip) idx = this.body.labelSkip;
        idx = this.body.parse(str,idx);

        this.src = str.substr(this.start,idx-this.start);
        idx = skipOptSemicolon(str,idx);
        return idx;
    };
    StmtFor.prototype.optimize = function() {
        var res = true;
        if(!this.expr1.optimize()) res=false;
        if(!this.expr2.optimize()) res=false;
        if(!this.expr3.optimize()) res=false;
        if(!this.body.optimize()) res=false;
        this.qSrc = this.qLbl + "for("+this.expr1.qSrc+";"+this.expr2.qSrc+";"+this.expr3.qSrc+")"+this.body.qSrc;
        if(res)
            eval("this.execute=function(state){"+this.qSrc+"}")
        return res;
    };
    StmtFor.prototype.execute = function(state) {
        var o = {
            nxt: this.executeStep2,
            program: this
        };
        state.stack.push(o);
        this.expr1.execute(state);
    };
    StmtFor.prototype.executeStep = function(state,stackEl) {
        return stackEl.nxt.call(this,state,stackEl);
    };
    StmtFor.prototype.executeStep2 = function(state,stackEl) {
        stackEl.nxt = this.executeStep3;
        this.expr2.execute(state);
        return true;
    };
    StmtFor.prototype.executeStep3 = function(state,stackEl) {
        stackEl.nxt = this.executeStep4;
        if(state.finCb && state.buf.val())
            this.body.execute(state);
        else
            state.stack.pop();
        return true;
    };
    StmtFor.prototype.executeStep4 = function(state,stackEl) {
        stackEl.nxt = this.executeStep2;
        this.expr3.execute(state);
        return true;
    };

    function stmtDetect(clsr, str, idx, checkLabel) {
        var stmt;
        var label;
        var labelSkip;
        idx = ss(str, idx);
        if(checkLabel) {
            var lbl = parseVarname(str,idx);
            if( lbl.length > 0 ) {
                var j = ss(str,idx + lbl.length);
                if(str.substr(j,1) === ':') {
                    label = lbl;
                    idx = ss(str,j+1);
                    labelSkip = idx;
                }
            }
        }
        if(ch1(str,idx) ===  '{')
            stmt = new StmtBlock(clsr);
        else if(startingWith(str,idx,'var'))
            stmt = new StmtVar(clsr);
        else if(startingWith(str,idx,'let'))
            throw formatParseError(str,idx,"'let' is not implemented");
        else if(startingWith(str,idx,'const'))
            throw formatParseError(str,idx,"'const' is not implemented");
        else if(startingWith(str,idx,'if'))
            stmt = new StmtIf(clsr);
        else if(startingWith(str,idx,'for')) {
            var i = ss(str,idx+3);
            i = ss(str,i+1);
            if(startingWith(str,i,'var')) i=ss(str,i+3);
            var v = parseVarname(str,i);
            i=ss(str,i+v.length);
            if(startingWith(str,i,'in') || startingWith(str,i,'of'))
                stmt = new StmtForIn(clsr);
            else
                stmt = new StmtFor(clsr);
        }
        else if(startingWith(str,idx,'switch'))
            stmt = new StmtSwitch(clsr);
        else if(startingWith(str,idx,'while'))
            stmt = new StmtWhile(clsr);
        else if(startingWith(str,idx,'do'))
            stmt = new StmtDoWhile(clsr);
        else if(startingWith(str,idx,'break'))
            stmt = new StmtBreak(clsr);
        else if(startingWith(str,idx,'continue'))
            stmt = new StmtContinue(clsr);
        else if(startingWith(str,idx,'return'))
            stmt = new StmtReturn(clsr);
        else if(startingWith(str,idx,'throw'))
            stmt = new StmtThrow(clsr);
        else if(startingWith(str,idx,'try'))
            stmt = new StmtTry(clsr);
        else if(startingWith(str,idx,'nsynjs.goto'))
            stmt = new StmtGoto(clsr);
        else
            stmt = new StmtSingle(clsr);
        stmt.label = label;
        stmt.qLbl = label?(label+":"):"";
        stmt.labelSkip = labelSkip;
        clsr.inferred = "";
        return stmt;

    }

    var StmtSwitch = function(clsr){
        this.clsr = clsr;
        this.src = null;
        this.stmtBlock = new StmtBlock(clsr);
        this.cases = [];
        this.idxs = [];
        this.breakable = true;
        this.label = null;
        this.defIndex = null;
        this.expr=null;
    };
    StmtSwitch.prototype.parse = function(str,idx) {
        this.start = idx;
        idx = ss(str, idx+6);
        if(ch1(str,idx) !=  '(')
            throw "expected  '('";
        idx = ss(str,idx+1);
        this.expr = new Expr(this.clsr);
        idx=this.expr.parse(str,idx);
        idx = ss(str,idx+1);
        if(ch1(str,idx) !=  '{')
            throw "expected  '{'";
        idx = ss(str,idx+1);

        while(ch1(str,idx) != '}' && idx < str.length) {
            idx = ss(str, idx);

            if(startingWith(str,idx,'case')) {
                idx = ss(str,idx+4);
                var co=new Expr(this.clsr);
                idx=co.parse(str,idx);
                this.cases.push(co);
                this.idxs.push(this.stmtBlock.ops.length);
                idx = ss(str, idx+1);
                continue;
            }

            if(startingWith(str,idx,'default')) {
                idx = ss(str, idx+7);
                if(ch1(str,idx)!=':')
                    throw "expected  ':'";
                this.defIndex = this.stmtBlock.ops.length;
                idx = ss(str, idx+1);
                continue;
            }

            var stmt = stmtDetect(this.clsr, str, idx, true);
            if(stmt.labelSkip) idx = stmt.labelSkip;
            idx = stmt.parse(str,idx);
            this.stmtBlock.ops.push(stmt);
            idx = ss(str, idx);
        }
        if(idx >= str.length)
            throw "unexpected end of statement";
        idx++;
        this.src = str.substr(this.start,idx-this.start);
        return idx;
    };
    StmtSwitch.prototype.optimize = function() {
        var res=true;
        if(!this.expr.optimize()) res=false;
        this.qSrc = this.qLbl + "switch("+this.expr.qSrc+"){\n";
        var caseIdx=0,opIdx=0,i=0;
        do  {
            while(i==this.idxs[caseIdx]) {
                if(!this.cases[caseIdx].optimize())  res = false;
                this.qSrc += "case "+this.cases[caseIdx].qSrc+":\n";
                caseIdx++;
            }
            if(i==this.defIndex)
                this.qSrc+="default:\n";
            if(this.stmtBlock.ops[i]) {
                if(!this.stmtBlock.ops[i].optimize()) res = false;
                this.qSrc+="  "+this.stmtBlock.ops[i].qSrc+";\n";
            }
            i++;
        } while(i<this.stmtBlock.ops.length);
        this.qSrc+="}\n";
        if(res)
            eval("this.execute = function(state){"+this.qSrc+"}");
        return res;
    };
    StmtSwitch.prototype.execute = function(state) {
        var o = {
            nxt: this.executeStep1,
            program: this,
            pc: 0
        };
        state.stack.push(o);
        this.expr.execute(state);
    };
    StmtSwitch.prototype.executeStep = function(state,stackEl) {
        return stackEl.nxt.call(this,state,stackEl);
    };
    StmtSwitch.prototype.executeStep1 = function (state,stackEl) {
        stackEl.exprVal = state.buf.val();
        stackEl.nxt = this.executeStep2;
        return true;
    };
    StmtSwitch.prototype.executeStep2 = function (state,stackEl) {
        stackEl.nxt = this.executeStep3;
        this.cases[stackEl.pc].execute(state);
        return true;
    };
    StmtSwitch.prototype.executeStep3 = function (state,stackEl) {
        if(state.buf.val() === stackEl.exprVal) {
            stackEl.nxt = this.executeStep5;
            state.stack.push({
                pc: this.idxs[stackEl.pc],
                program: this.stmtBlock
            });
        }
        else {
            stackEl.pc++;
            if(stackEl.pc < this.idxs.length)
                stackEl.nxt = this.executeStep2;
            else {
                stackEl.nxt = this.executeStep5;
                if(typeof this.defIndex == 'number')
                    state.stack.push({
                        pc: this.defIndex,
                        program: this.stmtBlock
                    });
            }
        }
        return true;
    };
    StmtSwitch.prototype.executeStep5 = function (state,stackEl) {
        state.stack.pop();
        return true;
    };


    var StmtBlock = function(clsr){
        this.clsr = clsr;
        this.src = null;
        this.qLbl = "";
        this.ops = [];
        this.labels = {};
    };
    StmtBlock.prototype.parse = function(str,idx) {
        this.start = idx;
        idx = ss(str, idx+1);
        while(ch1(str,idx) != '}' && idx < str.length) {
            idx = ss(str, idx);
            var stmt = stmtDetect(this.clsr, str, idx, true);
            if(stmt.labelSkip) idx = stmt.labelSkip;
            idx = stmt.parse(str,idx);
            if(stmt.label)
                this.labels[stmt.label] = this.ops.length;
            this.ops.push(stmt);
            idx = ss(str, idx);
        };
        if(idx >= str.length)
            throw "unexpected end of statement";
        idx++;
        this.src = str.substr(this.start,idx-this.start);
        return idx;
    };
    StmtBlock.prototype.optimize = function () {
        var res=true;
        this.qSrc = this.qLbl + "{";
        this.qSrc += this.ops.map(function (e) {
            if(!e.optimize())
                res = false;
            return e.qSrc;
        }).join(";");
        this.qSrc+="}";
        if(res)
            eval("this.execute = function(state) {var _f=function(){"+this.qSrc+"};_f.call(state.userThisCtx,state)}");
        return res;
    };
    StmtBlock.prototype.execute = function (state) {
        var o = {
            pc: 0,
            program: this
        };
        state.stack.push(o);
    };
    /**
     *
     * @param {State} state
     * @param stackEl
     * @returns {boolean}
     */
    StmtBlock.prototype.executeStep = function (state,stackEl) {
        if(stackEl.pc >= stackEl.program.ops.length) {
            state.stack.pop();
            return true;
        }
        var stmt = stackEl.program.ops[stackEl.pc++];
        stmt.execute(state);

        return true;
    };


    var StmtVar = function(clsr){
        this.clsr = clsr;
        this.src = null;
    };
    StmtVar.prototype.parse = function(str,idx) {
        this.start = idx;
        idx = ss(str,idx+3);
        this.expr = new Expr(this.clsr);
        this.expr.inVar=true;
        idx = this.expr.parse(str,idx);
        idx = skipOptSemicolon(str,idx);
        this.src = str.substr(this.start,idx-this.start);
        return idx;
    };
    StmtVar.prototype.optimize = function() {
        var res = this.expr.optimize();
        this.qSrc = this.qLbl + this.expr.qSrc;
        if(res)
            eval("this.execute = function(state) {"+this.qSrc+"}");
        return res;
    };
    StmtVar.prototype.execute = function(state) {
        this.expr.execute(state);
    };



    var StmtSingle = function(clsr){
        this.clsr = clsr;
        this.noCallback = true;
        this.src = null;
    };
    StmtSingle.prototype.parse = function(str,idx) {
        this.start = idx;
        idx = ss(str,idx);
        this.expr = new Expr(this.clsr);
        idx = this.expr.parse(str,idx);
        idx = skipOptSemicolon(str,idx);
        this.src = str.substr(this.start,idx-this.start);
        var e = Expr.simplify(this.expr);
        if( e.t === 'Function' && e.name ){
            this.clsr.varDefs[e.name] = true;
            this.clsr.funDecls[e.name] = e;
        }
        return idx;
    };
    StmtSingle.prototype.optimize = function() {
        var ret = this.expr.optimize();
        this.qSrc = this.qLbl + this.expr.qSrc;
        if(ret)
            eval("this.execute = function(state) {"+this.qSrc+"}");
        return ret;
    };
    StmtSingle.prototype.execute = function(state) {
        this.expr.execute(state);
    };

    var StmtGoto = function(clsr){
        this.clsr = clsr;
        this.src = "";
        this.expr = "";
    };
    StmtGoto.prototype.parse = function(str,idx) {
        this.start = idx;
        idx = ss(str,idx+"nsynjs.goto".length);
        if(ch1(str,idx) !== "(")
            throw "expected (";
        idx = ss(str,idx+1);
        this.expr = new Expr(this.clsr);
        idx=this.expr.parse(str,idx);
        idx = ss(str,idx+1);
        this.src = str.substr(this.start,idx-this.start);
        idx = skipOptSemicolon(str,idx);
        return idx;
    };
    StmtGoto.prototype.optimize = function() {
        this.expr.optimize();
        return false;
    };
    StmtGoto.prototype.execute = function(state) {
        var o = {
            program: this
        };
        state.stack.push(o);
        this.expr.execute(state);
    };
    StmtGoto.prototype.executeStep = function(state,stackEl) {
        var lblTo = state.buf.val();
        while(state.stack.length > 0) {
            var e = arrayLast(state.stack);
            if(e.program.labels && e.program.labels[lblTo] >= 0){
                e.pc = e.program.labels[lblTo];
                return true;
            }
            else
                state.stack.pop();
        }
        throw "cannot find label '"+lblTo+"'";
    };


    var StmtBreak = function(clsr){
        this.clsr = clsr;
        this.src = "";
        this.targetLabel = "";
    };
    StmtBreak.prototype.parse = function(str,idx) {
        this.start = idx;
        idx = ss(str,idx+5);
        var lbl = parseVarname(str,idx);
        if( lbl.length ) {
            this.targetLabel = lbl;
            idx = ss(str,idx+lbl.length);
        }
        this.src = str.substr(this.start,idx-this.start);
        idx = skipOptSemicolon(str,idx);
        return idx;
    };
    StmtBreak.prototype.optimize = function() {
        this.qSrc = this.qLbl + this.src;
        return false;
    };
    StmtBreak.prototype.execute = function(state) {
        var s = state, c=this.clsr;
        while(true) {
            while(s.stack.length > 0) {
                var e = s.stack.pop();
                if(!this.targetLabel && e.program.breakable
                    || this.targetLabel && e.program.label == this.targetLabel)
                    return;
            }
            if(c.parseCatch) {
                s.stack = [];
                s=s.callerState;
                c=c.clsr;
            }
            else
                throw "Illegal break";
        }
    };

    var StmtContinue = function(clsr){
        this.clsr = clsr;
        this.src = "";
        this.tgtLabel = "";
    };
    StmtContinue.prototype.parse = function(str,idx) {
        this.start = idx;
        idx = ss(str,idx+8);
        var lbl = parseVarname(str,idx);
        if( lbl.length ) {
            this.tgtLabel = lbl;
            idx = ss(str,idx+lbl.length);
        }
        this.src = str.substr(this.start,idx-this.start);
        idx = skipOptSemicolon(str,idx);
        return idx;
    };
    StmtContinue.prototype.optimize = function() {
        this.qSrc = this.qLbl + this.src;
        return false;
    };
    StmtContinue.prototype.execute = function(state) {
        var s = state, c = this.clsr;
        while (s.stack.length > 0) {
            var e = arrayLast(s.stack);
            if (e.program.breakable && (!this.tgtLabel || this.tgtLabel && this.tgtLabel === e.program.label))
                return;
            s.stack.pop();
            if (c.parseCatch) {
                s.stack = [];
                s = s.parent.state;
                c = c.clsr;
            }
        }
        throw "Illegal continue";
    };

    var StmtReturn = function(clsr){
        this.clsr = clsr;
        this.src = null;
    };
    StmtReturn.prototype.parse  = function (str,idx) {
        this.start = idx;
        idx = ss(str,idx + 'return'.length);
        this.expr = new Expr(this.clsr);
        idx = this.expr.parse(str,idx);
        this.src = str.substr(this.start,idx-this.start);
        idx = skipOptSemicolon(str,idx);
        return idx;
    };
    StmtReturn.prototype.optimize = function () {
        this.expr.optimize();
        this.qSrc = this.qLbl + "return "+this.expr.qSrc+";";
        return false;
    };
    StmtReturn.prototype.execute = function (state) {
        state.stack.push({
            program: this,
        });
        this.expr.execute(state);
    };
    StmtReturn.prototype.executeStep = function (state,stackEl) {
        var ret = state.buf.val();
        var s = state, c=this.clsr;
        while(c.parseCatch) {
            s.stack = [];
            s=s.callerState;
            c=c.clsr;
        }
        s.stack = [];
        s.retVal = ret;
        return true;
    };

    var StmtThrow = function(clsr){
        this.clsr = clsr;
        this.src = null;
    };
    StmtThrow.prototype.parse  = function (str,idx) {
        this.start = idx;
        idx = ss(str,idx + 'throw'.length);
        var opStart = idx;
        this.expr = new Expr(this.clsr);
        idx = this.expr.parse(str,idx);
        this.src = str.substr(this.start,idx-this.start);
        idx = skipOptSemicolon(str,idx);
        return idx;
    };
    StmtThrow.prototype.optimize = function () {
        this.expr.optimize();
        this.qSrc = this.qLbl + "throw "+this.expr.qSrc+";";
        return false;
    };
    StmtThrow.prototype.execute = function (state) {
        state.stack.push({
            program: this,
        });
        this.expr.execute(state);
    };
    StmtThrow.prototype.executeStep = function (state,stackEl) {
        state.throwException(state.buf.val());
        return true;
    };

    var StmtTry = function(clsr) {
        this.clsr = clsr;
        this.breakable = true;
        this.src = null;
    };
    StmtTry.prototype.parse = function (str,idx) {
        this.start = idx;
        idx = ss(str,idx+3);
        this.tryBlock = new StmtBlock(this.clsr);
        idx = this.tryBlock.parse(str,idx);

        idx = ss(str,idx);

        this.catchBlock = new OperandFunDef(this.clsr,true);
        idx = this.catchBlock.parse(str,idx);
        idx = ss(str,idx);

        this.src = str.substr(this.start,idx-this.start);
        idx = skipOptSemicolon(str,idx);
        return idx;
    };
    StmtTry.prototype.optimize = function() {
        var res=true;
        if(!this.tryBlock.optimize())
            res=false;
        if(!this.catchBlock.optimize())
            res=false;
        this.qSrc = this.qLbl + "try {"+this.tryBlock.qSrc+"}"+this.catchBlock.qSrc;
        if(res)
            eval("this.execute = function(state) {"+this.qSrc+"}");
        return res;
    };
    StmtTry.prototype.execute = function(state) {
        state.stack.push({
            program: this,
            _try: true
        });
        this.tryBlock.execute(state);
    };
    StmtTry.prototype.executeStep = function (state,stackEl) {
        state.stack.pop();
        return true;
    };

    var OperandString = function (clsr) {
        this.t = 'String';
        this.clsr = clsr;
    };
    OperandString.test = function(str,idx) {
        var c = ch1(str,idx);
        return c=="'" || c=='"';
    };
    OperandString.prototype.parse = function(str,idx) {
        this.start = idx;
        var q = ch1(str,idx);
        if(!OperandString.test(str,idx))
            throw "expected quote character";
        for(idx++; idx < str.length; idx++) {
            var c = ch1(str,idx);
            if(q == '"' && c=='\\'){
                idx++;
                continue;
            }
            if(c==q) {
                idx++;
                this.src = str.substr(this.start,idx-this.start);
                eval("this.value = "+this.src+";");
                return ss(str,idx);
            }
        }
        throw "unexpected end of string";
    };
    OperandString.prototype.execute = function(state) {
        state.buf=new ValRef(state,ValRef.TypeValue,this.value)
    };
    OperandString.prototype.optimize = function() {
        this.qSrc = this.src;
        return true;
    };
    var OperandConst = function (clsr) {
        this.t = 'Const';
        this.clsr = clsr;
    };
    OperandConst.keywords={'undefined':true,'false':true,'true':true,'null':true};
    OperandConst.test = function(str,idx) {
        for(var k in OperandConst.keywords)
            if(startingWith(str,idx,k))
                return true;
        return false;
    };
    OperandConst.prototype.parse = function(str,idx) {
        if(!OperandConst.test(str,idx))
            throw "expected constant";
        this.start = idx;
        this.src = parseVarname(str,idx);
        eval("this.value = "+this.src+";");
        return ss(str,idx+this.src.length);
    };
    OperandConst.prototype.optimize = function() {
        this.qSrc = this.src;
        return true;
    };
    OperandConst.prototype.execute = function(state) {
        state.buf=new ValRef(state,ValRef.TypeValue,this.value)
    };

    var OperandNumber = function (clsr) {
        this.t = 'Number';
        this.clsr = clsr;
    };
    OperandNumber.test = function(str,idx) {
        var c1 = ch1(str,idx);
        if(isDigit(c1))
            return true;
        if(c1=='.' && isDigit(ch1(str,idx+1)))
            return true;
        if(c1=='-' || c1=='')
            return false;
    };
    OperandNumber.prototype.parse = function(str,idx) {
        if(!OperandNumber.test(str,idx))
            throw "expected digit";
        this.start = idx;
        var dec = false, e = false;

        for(; idx < str.length; idx++) {
            var c = ch1(str,idx);
            if(isDigit(c)) { continue }
            if(c=='.' && !dec) { dec = true; continue; }
            if((c=='e' || c=='E') && !e) { e = true; continue; }
            break;
        }
        this.src = str.substr(this.start, idx - this.start);
        eval("this.value = "+this.src+";");
        return ss(str,idx);
    };
    OperandNumber.prototype.optimize = function() {
        this.qSrc = this.src;
        return true;
    };
    OperandNumber.prototype.execute = function(state) {
        state.buf=new ValRef(state,ValRef.TypeValue,this.value)
    };

    var OperandFunDef = function (clsr,parseCatch) {
        this.t = 'Function';
        this.clsr = clsr;
        this.parseCatch = parseCatch;
        this.name = '';
        this.params = null;
        this.operatorBlock = null;
        this.src = null;
        this.fn = null;
        this.varDefs = {};
        this.varUses = [];
        this.funcs = [];
        this.funDecls = {};
    };
    OperandFunDef.test = function(str,idx) {
        return startingWith(str,idx,'function');
    };
    OperandFunDef.prototype.parse = function(str,idx) {
        this.start = idx;
        if(this.parseCatch) {
            if(!startingWith(str,idx,'catch'))
                throw "expected 'catch'";
            idx = ss(str,idx+5);
        }
        else {
            if(!OperandFunDef.test(str,idx))
                throw "expected 'function'";
            idx = ss(str,idx+8);
            if(str.charAt(idx) !== "(") {
                this.name = parseVarname(str,idx);
                idx +=this.name.length;
                idx = ss(str,idx);
            }
        }
        if(ch1(str,idx) !== "(" )
            throw "expected '('";
        idx = ss(str,idx+1);
        this.params = new OperandList(this,OperandLit);
        idx = this.params.parse(str,idx);
        for(var i=0; i<this.params.children().length; i++)
            this.varDefs[this.params.children()[i].value]=this.params.children()[i];
        this.varDefs['nsynjsCtx'] = true;
        idx = ss(str,idx+1);
        this.operatorBlock = new StmtBlock(this);
        idx = this.operatorBlock.parse(str,idx);
        this.src = str.substr(this.start,idx-this.start);
        this.fn = function(){ throw 'This function is intended to be called via nsynjs'};
        this.fn.nsynjsBin = this;
        idx = ss(str,idx);

        this.resolve();
        this.operatorBlock.optimize();

        return idx;
    };
    OperandFunDef.prototype.resolve = function() {
        for(var v=0; v<this.varUses.length; v++) {
            var vu=this.varUses[v];
            var ref={};
            if(vu.value === 'this')
                vu.acc = 'state.userThisCtx';
            else if(vu.value === 'arguments')
                vu.acc = 'state.localVars.arguments';
            else {
                var f=false;
                var acc="";
                for(var l=this; l; l=l.clsr) {
                    if(l.varDefs[vu.value]) {
                        f=true;
                        break;
                    }
                    if(acc)
                        acc += "clsr.";
                    else
                        acc = "state.nsynjsBin.";
                }
                if(f)
                    vu.acc = acc+"state.localVars."+vu.value;
                else
                    vu.acc = vu.value;

                vu.qSrc = vu.value;

                eval("ref.set = function(state,prev,idx,v){return "+vu.acc+"=v}");
            }
            eval("ref.get = function(state,prev,idx){return "+vu.acc+"}");
            vu.ref = ref;
        }
        for(var i=0; i<this.funcs.length; i++) {
            this.funcs[i].resolve();
        }
    };
    OperandFunDef.prototype.optimize = function() {
        var res=true;
        var ps = this.params.elements.map(function (e) { return e.value}).join(',');

        if(!this.params.optimize())
            res = false;
        if(!this.operatorBlock.optimize())
            res = false;
        if(this.parseCatch)
            this.qSrc = "catch("+ps+")"+this.operatorBlock.qSrc;
        else
            this.qSrc = "function "+this.name+'('+ps+')'+this.operatorBlock.qSrc;
        eval("this.fn = function "+this.name+"(){ throw 'Function \""+this.name+"\" is intended to be called via nsynjs'}");
        this.fn.nsynjsBin = this;

        return false;
    };
    OperandFunDef.prototype.execute = function(state) {
        this.state = state;
        state.buf=new ValRef(state,ValRef.TypeValue,this.fn);
    };

    var OperandPathAccessFun = function (clsr) {
        this.t = 'AccessFun';
        this.clsr = clsr;
    };
    OperandPathAccessFun.test = function(str,idx) {
        return ch1(str,idx) === '('
    };
    OperandPathAccessFun.prototype.parse = function(str,idx) {
        this.start=idx;
        if(!OperandPathAccessFun.test(str,idx))
            throw "expected '('";
        idx = ss(str,idx+1);
        this.params = new OperandList(this.clsr);
        idx = this.params.parse(str,idx);
        idx = ss(str,idx+1);
        this.src = str.substr(this.start,idx-this.start);
        return idx;
    };
    OperandPathAccessFun.prototype.ref = {
        get: function (state,prev,idx) {
            return prev.apply(idx[0],idx[1]);
        }
    };
    OperandPathAccessFun.prototype.children = function() {
        return this.params.children();
    };
    OperandPathAccessFun.prototype.optimize = function () {
        var res=true;
        if(!this.params.optimize())
            res = false;
        this.qSrc = "("+this.params.qSrc+")";
        return false;
    };
    OperandPathAccessFun.prototype.execute = function(state,prev) {
        var ctx=arrayLast(arrayLast(state.stack).ctxs);
        state.stack.push({
            program:    this,
            prev: prev,
            ctx: ctx,
            nxt: this.executeStep1
        });
        this.params && this.params.children && this.params.children().length && this.params.execute(state);
    };
    OperandPathAccessFun.prototype.executeStep = function(state,stackEl) {
        return stackEl.nxt.call(this,state,stackEl);
    };
    OperandPathAccessFun.prototype.executeStep1 = function(state,stackEl) {
        var params = [stackEl.ctx];
        params.push(state.buf.val());
        var f=stackEl.prev.val();

        if(typeof f !== 'function')
            throw 'Not a function: ' + f;

        if(!f.nsynjsBin) {
            state.destructor = null;
            state.doNotWait = false;
            var retVal = this.ref.get(state,f,params);
            state.buf = new ValRef(state,ValRef.TypeValue,retVal);
            state.stack.pop();
            if(f.nsynjsHasCallback)
                if(state.doNotWait)
                    return true;
                else
                    return false;
            if(retVal && retVal.then) {
                retVal.then(function (res) {
                    state.buf = new ValRef(state, ValRef.TypeValue, {data: res});
                    state.resume();
                }, function (err) {
                    state.resume(err);
                });
                return false;
            }
            else
                return true;
        }
        stackEl.nxt = this.executeStep2;
        state.funcStart(f,stackEl.ctx,params[1]);
        return true;
    };
    OperandPathAccessFun.prototype.executeStep2 = function(state,stackEl) {
        state.stack.pop();
        return true;
    };

    var OperandPathAccessIdx = function (clsr) {
        this.t = 'AccessIdx';
        this.clsr = clsr;
    };
    OperandPathAccessIdx.test = function(str,idx) {
        return ch1(str,idx) === '['
    };
    OperandPathAccessIdx.prototype.parse = function(str,idx) {
        this.start=idx;
        if(!OperandPathAccessIdx.test(str,idx))
            throw "expected '['";
        idx = ss(str,idx+1);
        this.expr = new Expr(this.clsr);
        idx = this.expr.parse(str,idx);
        idx = ss(str,idx+1);
        this.src = str.substr(this.start,idx-this.start);
        return idx;
    };
    OperandPathAccessIdx.prototype.ref = {
        get: function (state,prev,idx) {
            return prev[idx]
        },
        set: function (state,prev,idx,v) {
            return prev[idx]=v
        }
    };
    OperandPathAccessIdx.prototype.optimize = function() {
        var res=true;
        if(!this.expr.optimize())
            res=false;
        this.qSrc = "["+this.expr.qSrc+"]";
        return res;
    };
    OperandPathAccessIdx.prototype.execute = function(state,prev) {
        state.stack.push({
            program:    this,
            prev: prev
        });
        this.expr.execute(state);
    };
    OperandPathAccessIdx.prototype.executeStep = function(state,stackEl) {
        state.buf = new ValRef(state,ValRef.TypeRef,null,this.ref,stackEl.prev.val(),state.buf.val());
        state.stack.pop();
        return true;
    };

    var OperandNew = function (clsr) {
        this.t = 'New';
        this.clsr = clsr;
        this.expr = null;
        this.params = null;
    };
    OperandNew.test = function(str,idx) {
        return startingWith(str,idx,'new');
    };
    OperandNew.prototype.parse = function(str,idx) {
        this.start=idx;
        if(!OperandNew.test(str,idx))
            throw "expected 'new'";
        idx = ss(str,idx+3);

        this.expr = new OperandPath(this.clsr,true);

        idx = this.expr.parse(str,idx);
        idx=ss(str,idx);
        if(ch1(str,idx)==='(') {
            idx=ss(str,idx+1);
            this.params = new OperandList(this.clsr);
            idx = this.params.parse(str,idx);
            idx=ss(str,idx+1);
        }
        this.src = str.substr(this.start,idx-this.start);
        return idx;
    };
    OperandNew.prototype.ref = {
        get: function (state,prev,idx) {
            return new (Function.prototype.bind.apply(prev,idx));
        }
    };
    OperandNew.prototype.children = function () {
        return this.params && this.params.children();
    };
    OperandNew.prototype.optimize = function () {
        return false;
    };
    OperandNew.prototype.execute = function(state,prev) {
        state.stack.push({
            program:    this,
            prev: prev,
            nxt: this.executeStep0
        });
        this.expr.execute(state);
    };
    OperandNew.prototype.executeStep = function(state,stackEl) {
        return stackEl.nxt.call(this,state,stackEl);
    };
    OperandNew.prototype.executeStep0 = function(state,stackEl) {
        stackEl.nxt = this.executeStep1;
        stackEl.f = state.buf.val();
        stackEl.ctx = Object.create(stackEl.f.prototype);
        this.params && this.params.execute(state);
        return true;
    };
    OperandNew.prototype.executeStep1 = function(state,stackEl) {
        var params = state.buf.val();
        var f=stackEl.f;
        if(!f.nsynjsBin) {
            this.params && params.unshift(this);
            state.destructor = null;
            state.doNotWait = false;
            var retVal = this.ref.get(state,f,params);
            state.buf = new ValRef(state,ValRef.TypeValue,retVal);
            state.stack.pop();
            if(f.nsynjsHasCallback)
                return state.doNotWait;
            if(retVal && retVal.then) {
                retVal.then(function (res) {
                    state.buf = new ValRef(state, ValRef.TypeValue, {data: res});
                    state.resume();
                }, function (err) {
                    state.resume(err);
                });
                return false;
            }
            else
                return true;
        }
        stackEl.nxt = this.executeStep2;
        state.funcStart(f, stackEl.ctx, params, true);
        return true;
    };
    OperandNew.prototype.executeStep2 = function(state,stackEl) {
        state.stack.pop();
        return true;
    };

    var OperandPath = function (clsr,inNew) {
        this.t = 'Path';
        this.clsr = clsr;
        this.inNew = inNew;
        this.path = [];
        this.inVar=false;
    };
    OperandPath.test = function(str,idx,clsr) {
        var type=null;

        if(OperandConst.test(str,idx))
            type = OperandConst;
        else if(OperandNumber.test(str,idx))
            type = OperandNumber;
        else if(OperandObj.test(str,idx))
            type = OperandObj;
        else if(OperandArr.test(str,idx))
            type = OperandArr;
        else if(OperandString.test(str,idx))
            type = OperandString;
        else if(OperandFunDef.test(str,idx))
            type = OperandFunDef;
        else if(OperandNew.test(str,idx))
            type = OperandNew;
        else if(Delete.test(str,idx))
            type = Delete;
        else if(Typeof.test(str,idx))
            type = Typeof;
        else if(OperandLit.test(str,idx))
            type = OperandLit;
        else if(Expr.test(str,idx))
            type = Expr;
        if(type) {
            var ret=new type(clsr);
            ret.skipTo=idx;
            return ret;
        }
    };
    OperandPath.prototype.parse = function(str,idx) {
        this.start = idx;
        var prev = OperandPath.test(str,idx, this.clsr);
        if(!prev)
            throw "expected value";
        idx = prev.parse(str,prev.skipTo);
        if(prev.t === 'Lit') {
            prev.inVar = this.inVar;
            this.clsr.varUses.push(prev);
        }
        else if(prev.t === 'Function')
            this.clsr.funcs.push(prev);

        this.path.push(prev);
        idx = ss(str, idx);
        var nxt,f=false;
        while(idx < str.length || f) {
            var c = ch1(str,idx);
            if(c==='.') {
                nxt = new OperandLit(prev,arrayLast(this.path));
                idx++;
            }
            else if(c==='(') {
                if(this.inNew)
                    break;
                nxt = new OperandPathAccessFun(prev.clsr);
            }
            else if(c==='[')
                nxt = new OperandPathAccessIdx(prev.clsr);
            else
                break;
            idx = nxt.parse(str,idx);
            this.path.push(nxt);
            this.clsr.inferred = "";
            idx = ss(str, idx);
        }
        this.src = str.substr(this.start,idx-this.start);
        return ss(str,idx);
    };
    OperandPath.prototype.children = function() {
        return this.path;
    };
    OperandPath.prototype.optimize = function(state) {
        var res=true;
        this.qSrc="";

        for(var i=0; i<this.children().length; i++) {
            var c=this.children()[i];
            if(!c.optimize())
                res=false;
            this.qSrc += c.qSrc;
        }
        if(res) {
            eval("this.ref = { get: function (state, prev, idx) { return "+this.qSrc+" }}");
            if(arrayLast(this.path).ref && arrayLast(this.path).ref.set)
                eval("this.ref.set=function (state, prev, idx, v) { return "+this.qSrc+" = v}");
            this.execute = function(state) {
                state.buf = new ValRef(state,ValRef.TypeRef,null,this.ref)
            };
        }
        return res;
    };
    OperandPath.prototype.execute = function(state) {
        state.buf=null;
        state.stack.push({
            program: this,
            pc: 0,
            values: [],
            ctxs: [],
            currCtx: state.userThisCtx,
            nxt: this.executeStep1
        })
    };
    OperandPath.prototype.executeStep = function(state,stackEl) {
        return stackEl.nxt.call(this,state,stackEl);
    };
    OperandPath.prototype.executeStep1 = function(state,stackEl) {
        if(stackEl.pc >= this.path.length) {
            var e=state.stack.pop();
            state.buf= arrayLast(e.values);
            return true;
        }
        stackEl.nxt = this.executeStep2;
        var e = this.path[stackEl.pc];
        stackEl.pc++;
        e.execute(state, state.buf);
        return true;
    };
    OperandPath.prototype.executeStep2 = function(state,stackEl) {
        stackEl.nxt = this.executeStep1;
        var v=state.buf;
        stackEl.values.push(v);
        stackEl.ctxs.push(stackEl.currCtx);
        stackEl.currCtx = v.val();
        return true;
    };

    var OperandLit = function (clsr,parent) {
        this.t = 'Lit';
        this.clsr = clsr;
        this.parent = parent;
        this.ref = {get: null, set: null};
        this.inVar = false;
        this.value = null;
    };
    OperandLit.test = function(str,idx) {
        return isVarnameBegin(ch1(str,idx));
    };
    OperandLit.prototype.parse = function(str,idx) {
        if(!OperandLit.test(str,idx))
            throw "expected variable name";
        this.value = parseVarname(str,idx);
        idx = ss(str, idx + this.value.length);
        if(!this.parent && this.value === 'this')
            eval("this.ref.get = function(state,prev,idx) { return state.userThisCtx }");
        else if (!this.parent && this.value === 'arguments')
            eval("this.ref.get = function(state,prev,idx) { return state.localVars.arguments }");
        else {
            eval("this.ref.get = function(state,prev,idx) { return prev."+this.value+" }");
            eval("this.ref.set = function(state,prev,idx,v) { return prev."+this.value+"=v }");
        }
        if(!this.parent && this.value !== 'this' && this.value !== 'arguments')
            this.clsr.inferred = this.value;

        return ss(str, idx);
    };
    OperandLit.prototype.optimize = function() {
        if(this.parent)
            this.qSrc = "."+this.value;
        else
            this.qSrc = this.acc || this.value;
        return true;
    };
    OperandLit.prototype.execute = function(state,prev) {
        state.buf = new ValRef(state,ValRef.TypeRef,null,this.ref,prev&&prev.val(),this.value);
    };

    var OperandList = function (clsr,type) {
        this.t = 'List';
        this.clsr = clsr;
        this.elements = [];
        this.type = type || Expr;
    };
    OperandList.prototype.parse = function(str,idx) {
        this.start = idx;
        while(idx < str.length) {
            idx = ss(str,idx);
            var c = ch1(str,idx);
            if(c === ']' || c === ')') {
                this.src = str.substr(this.start,idx-this.start);
                return idx;
            }
            var value = new this.type(this.clsr,1);
            idx = value.parse(str,idx);
            this.elements.push(value);
            idx = ss(str,idx);
            if(ch1(str,idx) === ',')
                idx = ss(str,idx+1);
        }
        throw "unexpected end of object";
    };
    OperandList.prototype.optimize = function() {
        var t=[], res=true;
        for(var i=0; i<this.elements.length; i++) {
            if(!this.elements[i].optimize())
                res = false;
            t.push(this.elements[i].qSrc)
        }
        this.qSrc = t.join(',');
        if(res && this.type === 'Expr')
            eval("this.execute = function(state) {state.buf = new ValRef(state,ValRef.TypeValue,["+this.qSrc+"])}");
        return res;
    };
    OperandList.prototype.execute = function(state) {
        state.stack.push({
            program: this,
            pc: 0,
            values: [],
            nxt: this.executeStep1
        })
    };
    OperandList.prototype.executeStep = function(state, stackEl) {
        return stackEl.nxt.call(this,state,stackEl);
    };
    OperandList.prototype.executeStep1 = function(state, stackEl) {
        if(stackEl.pc >= stackEl.program.elements.length) {
            var e=state.stack.pop();
            state.buf=new ValRef(state,ValRef.TypeValue,e.values);
            return true;
        }
        var e = this.elements[stackEl.pc];
        stackEl.pc++;
        stackEl.nxt=this.executeStep2;
        e.execute(state);
        return true;
    };
    OperandList.prototype.executeStep2 = function(state, stackEl) {
        stackEl.values.push(state.buf.val());
        stackEl.nxt=this.executeStep1;
        return true;
    };
    OperandList.prototype.children = function() {
        return this.elements;
    };

    var OperandArr = function (clsr) {
        this.t = 'Arr';
        this.clsr = clsr;
    };
    OperandArr.test = function(str,idx) {
        return ch1(str,idx) === '['
    };
    OperandArr.prototype.parse = function(str,idx) {
        if(!OperandArr.test(str,idx))
            throw "expected [";
        this.start = idx;
        idx++;
        this.arr = new OperandList(this.clsr);
        idx = this.arr.parse(str,idx);
        return ss(str,idx+1);
    };
    OperandArr.prototype.children = function() {
        return this.arr.children();
    };
    OperandArr.prototype.optimize = function() {
        var res=true;
        if(!this.arr.optimize())
            res = false;
        this.qSrc="["+this.arr.qSrc+"]";
        if(res)
            eval("this.execute = function(state) {state.buf = new ValRef(state,ValRef.TypeValue,("+this.qSrc+"))}");
        return res;
    };
    OperandArr.prototype.execute = function(state) {
        this.arr.execute(state);
    };

    var OperandObjKVPair = function (key, value) {
        this.key = key;
        this.value = value;
    };
    var OperandObj = function (clsr) {
        this.t = 'Obj';
        this.clsr = clsr;
        this.props = [];
    };
    OperandObj.test = function(str,idx) {
        return ch1(str,idx) === '{'
    };
    OperandObj.prototype.parse = function(str,idx) {
        if(!OperandObj.test(str,idx))
            throw "expected {";
        this.start = idx;
        idx++;
        while(idx < str.length) {
            idx = ss(str,idx);
            var c = ch1(str,idx);
            if(c === '}') {
                idx++;
                this.src = str.substr(this.start, idx - this.start);
                return ss(str,idx);
            }
            var key,keyStr;
            if(OperandNumber.test(str,idx))
                key = new OperandNumber(this.clsr);
            else if(OperandString.test(str,idx))
                key = new OperandString(this.clsr);
            else if(OperandLit.test(str,idx))
                key = new OperandLit(this.clsr);
            else
                throw "expected object key";
            idx = key.parse(str,idx);
            keyStr = key.value;
            this.clsr.inferred = key.value;
            idx = ss(str,idx);
            if(ch1(str,idx)!==':')
                throw "expected :";
            idx = ss(str,idx+1);
            var value = new Expr(this.clsr,1);
            idx = value.parse(str,idx);
            this.props.push(new OperandObjKVPair(keyStr, value));
            idx = ss(str,idx);
            if(ch1(str,idx) === ',')
                idx = ss(str,idx+1);
        }
        throw "unexpected end of object";
    };
    OperandObj.prototype.children = function(res) {
        return this.props;
    };
    OperandObj.prototype.optimize = function() {
        var res=true;
        this.qSrc="{";
        for(var i=0; i<this.props.length; i++) {
            if(!this.props[i].value.optimize())
                res = false;
            this.qSrc+=this.props[i].key + ':' + this.props[i].value.qSrc+",\n";
        }
        this.qSrc+="}";

        if(res)
            eval("this.execute = function(state) {state.buf = new ValRef(state,ValRef.TypeValue,("+this.qSrc+"))}");

        return res;
    };
    OperandObj.prototype.execute = function(state) {
        state.stack.push({
            program: this,
            pc: 0,
            obj: {},
            nxt: this.executeStep1
        })
    };
    OperandObj.prototype.executeStep = function(state, stackEl) {
        return stackEl.nxt.call(this,state,stackEl);
    };
    OperandObj.prototype.executeStep1 = function(state, stackEl) {
        if(stackEl.pc >= stackEl.program.props.length) {
            var e=state.stack.pop();
            state.buf=new ValRef(state,ValRef.TypeValue,e.obj);
            return true;
        }
        var e = this.props[stackEl.pc].value;
        stackEl.nxt=this.executeStep2;
        e.execute(state);
        return true;
    };
    OperandObj.prototype.executeStep2 = function(state, stackEl) {
        stackEl.obj[this.props[stackEl.pc].key]=state.buf.val();
        stackEl.pc++;
        stackEl.nxt=this.executeStep1;
        return true;
    };

    var ValRef = function (state,type,v,ref,prev, idx) {
        this.state=state;
        this.type=type;
        this.v=v;
        this.ref=ref;
        this.prev=prev;
        this.idx=idx;
    };
    ValRef.TypeValue=0;
    ValRef.TypeRef=1;
    ValRef.prototype.set = function (v) {
        if(this.type !== ValRef.TypeRef)
            throw "incorrect assignment";
        return this.ref.set(this.state,this.prev,this.idx,v);
    };
    ValRef.prototype.val = function() {
        switch(this.type) {
            case ValRef.TypeValue:
                return this.v;
            case ValRef.TypeRef:
                return this.ref.get(this.state,this.prev,this.idx);
            default:
                throw "unknown value type"
        }
    };

    var Delete = function (clsr) {
        this.t = 'Delete';
        this.clsr = clsr;
        this.expr = null;
    };

    Delete.test = function(str,idx) {
        return startingWith(str,idx,'delete');
    };

    Delete.prototype.parse = function(str,idx) {
        this.start=idx;
        if(!Delete.test(str,idx))
            throw "expected 'delete'";
        idx = ss(str,idx+6);

        this.expr = new OperandPath(this.clsr);
        idx = this.expr.parse(str,idx);
        idx=ss(str,idx);
        this.src = str.substr(this.start,idx-this.start);
        this.expr = Expr.simplify(this.expr);
        return idx;
    };
    Delete.prototype.children = function () {
        return this.expr.children && this.expr.children();
    };
    Delete.prototype.optimize = function() {
        var res = true;
        if(!this.expr.optimize()) res = false;
        if(this.expr.t==='Lit')
            this.qSrc = "false";
        else
            this.qSrc = "delete "+this.expr.qSrc;
        if(res)
            eval("this.execute = function(state) {state.buf = new ValRef(state,ValRef.TypeValue,("+this.qSrc+"))}");
        return res;
    };
    Delete.prototype.execute = function(state) {
        state.stack.push({
            program:    this,
        });
        this.expr.execute(state);
    };
    Delete.prototype.executeStep = function(state,stackEl) {
        var res = !!state.buf.prev && delete state.buf.prev[state.buf.idx];
        state.buf = new ValRef(state,ValRef.TypeValue,res);
        state.stack.pop();
        return true;
    };

    var Typeof = function (clsr) {
        this.t = 'Typeof';
        this.clsr = clsr;
        this.expr = null;
    };

    Typeof.test = function(str,idx) {
        return startingWith(str,idx,'typeof');
    };
    Typeof.prototype.parse = function(str,idx) {
        this.start=idx;
        if(!Typeof.test(str,idx))
            throw "expected 'typeof'";
        idx = ss(str,idx+6);

        this.expr = new Expr(this.clsr,16);
        idx = this.expr.parse(str,idx);
        idx=ss(str,idx);
        this.src = str.substr(this.start,idx-this.start);
        this.expr = Expr.simplify(this.expr);
        return idx;
    };
    Typeof.prototype.children = function () {
        return this.expr.children && this.expr.children();
    };
    Typeof.prototype.optimize = function() {
        var res = true;
        if(!this.expr.optimize()) res = false;
        this.qSrc = "typeof ("+this.expr.qSrc+")";
        if(res)
            eval("this.execute = function(state) {state.buf = new ValRef(state,ValRef.TypeValue,("+this.qSrc+"))}");
        return res;
    };
    Typeof.prototype.execute = function(state) {
        state.stack.push({
            program:    this
        });
        this.expr.execute(state);
    };
    Typeof.prototype.executeStep = function(state,stackEl) {
        var res;
        try { res = typeof (state.buf.val()) } catch (e) { res = "undefined"};
        state.buf = new ValRef(state,ValRef.TypeValue,res);
        state.stack.pop();
        return true;
    };

    var CondExpr = function (clsr, type) {
        this.t = 'CondExpr';
        this.clsr = clsr;
        this.type = type;
        switch(this.type) {
            case CondExpr.TypeAnd:
                this.prio = 7;
                this.execute = this.executeAnd;
                break;
            case CondExpr.TypeOr:
                this.prio = 6;
                this.execute = this.executeOr;
                break;
            case CondExpr.TypeYesNo:
                this.prio = 5;
                this.execute = this.executeYesNo;
                break;
            default:
                throw "Incorrect condition type: "+this.type;
        }
    };
    CondExpr.TypeAnd = 1;
    CondExpr.TypeOr = 2;
    CondExpr.TypeYesNo = 3;
    CondExpr.prototype.parse = function (str,idx) {
        this.start = idx;
        this.expr = new Expr(this.clsr, this.prio);
        idx = this.expr.parse(str,idx);
        idx = ss(str,idx);
        if(this.type === CondExpr.TypeYesNo) {
            if(ch1(str,idx) === ':') {
                idx = ss(str,idx+1);
                this.expr2 = new Expr(this.clsr, this.prio);
                idx = this.expr2.parse(str,idx);
                idx = ss(str,idx);
            }
            else
                throw "expected ':'";
        }
        this.src = str.substr(this.start,idx-this.start);
        return idx;
    };
    CondExpr.prototype.children = function () {
        return this.expr2?[this.expr,this.expr2]:[this.expr];
    };
    CondExpr.prototype.optimize=function() {
        var res=true;
        if(!this.expr.optimize())
            res = false;
        if(this.expr2 && !this.expr2.optimize())
            res = false;
        this.qSrc = this.expr.qSrc;
        if(this.type === CondExpr.TypeYesNo)
            this.qSrc += ":"+this.expr2.qSrc;
        return res;
    };
    CondExpr.prototype.executeAnd = function(state) {
        state.buf.val() && this.expr.execute(state);
    };
    CondExpr.prototype.executeOr = function(state) {
        state.buf.val() || this.expr.execute(state);
    };
    CondExpr.prototype.executeYesNo = function(state) {
        state.buf.val()?this.expr.execute(state):this.expr2.execute(state);
    };


    var Expr = function (clsr,minPrio) {
        this.t = 'Expr';
        this.clsr = clsr;
        this.minPrio=minPrio||0;
        this.childs=[];
        this.inVar=false;
    };
    Expr.test = function (str,idx) {
        return ch1(str,idx)==='(';
    };
    Expr.prototype.parse = function (str,idx) {
        this.start = idx;
        while( idx < str.length) {
            var c=ch1(str,idx);
            if(c==='}' || c===')' || c===']' || c===';' || c===':'
                || startingWith(str,idx,'in') || startingWith(str,idx,'of'))
                break;
            var op = new ExprTokenOp(this.clsr);
            var nxtIdx = op.parse(str,idx,arrayLast(this.childs));
            if(nxtIdx !== idx) {
                if(op.prio < this.minPrio)
                    break;
                idx = nxtIdx;
                this.childs.push(op);

                var e=null;
                if(op.src === '?')
                    e = new CondExpr(this.clsr, CondExpr.TypeYesNo);
                else if(op.src === '&&')
                    e = new CondExpr(this.clsr, CondExpr.TypeAnd);
                else if(op.src === '||')
                    e = new CondExpr(this.clsr, CondExpr.TypeOr);
                if(e) {
                    idx = e.parse(str,idx);
                    idx = ss(str,idx);
                    this.childs.push(e);
                }

                continue;
            }
            if(Expr.test(str,idx)) {
                op  = new Expr(this.clsr);
                idx=ss(str,idx+1);
                idx = op.parse(str,idx);
                idx = ss(str,idx+1);
            }
            else if(OperandPath.test(str,idx)) {
                op = new OperandPath(this.clsr);
                idx = op.parse(str,idx);
                if(this.inVar && op.children().length===1 && op.children()[0].t==='Lit') {
                    var l = arrayLast(this.childs);
                    if(!l || l && l.prio <= 3 ) {
                        if(op.children()[0].value)
                            this.clsr.varDefs[op.children()[0].value] = op;
                        op.inVar = true;
                        op.children()[0].inVar = true;
                    }
                }
            }
            else
                break;

            var s = Expr.simplify(op);
            if(s.t==='Function' && !s.name && this.clsr.inferred)
                s.name = this.clsr.inferred;

            if(op.t==='Path' && this.childs.length && arrayLast(this.childs).t !== 'Op') {
                throw formatParseError(str,op.start,"Unexpected operand. Is ';' missing?");
            }
            this.childs.push(op);
            idx = ss(str,idx);
        }
        var lst = arrayLast(this.childs);
        if(lst && lst.src===',')
            this.childs.pop();
        this.src = str.substr(this.start,idx-this.start);

        return idx;
    };
    Expr.prototype.children = function () {
        return this.childs;
    };
    Expr.prototype.execute = function(state) {
        var o = {
            program: this,
            ops: [],
            vals: [],
            childIdx: 0,
            nxt: this.executeStepEvalToken
        };
        state.stack.push(o);
    };
    Expr.prototype.executeStep = function(state,stackEl) {
        return stackEl.nxt.call(this,state,stackEl);
    };
    Expr.prototype.executeStepEvalToken = function(state,stackEl) {
        if(stackEl.childIdx >= this.childs.length) {
            if(stackEl.ops.length === 0){
                if(stackEl.vals.length !== 1)
                    throw "Expr eval incorrect";
                state.stack.pop();
                state.buf=stackEl.vals[0];
            }
            else {
                stackEl.prio = 0;
                stackEl.nxt = this.executeStepEvalStack;
                stackEl.retTo = this.executeStepEvalToken;
            }
            return true;
        }
        stackEl.token = this.childs[stackEl.childIdx++];
        if(stackEl.token.t!=='Op') {
            stackEl.nxt = this.executeStepAfterEval;
            stackEl.token.execute(state);
        }
        else {
            if(stackEl.ops.length && !(arrayLast(stackEl.ops).assign && stackEl.token.assign)) {
                stackEl.prio = stackEl.token.prio;
                stackEl.nxt = this.executeStepEvalStack;
                stackEl.retTo = this.executeStepEvalToken2;
            }
            else
                stackEl.nxt = this.executeStepEvalToken2;
        }
        return true;
    };
    Expr.prototype.executeStepEvalToken2 = function(state,stackEl) {
        var t = stackEl.token;
        stackEl.ops.push(t);
        stackEl.nxt = this.executeStepEvalToken;
        return true;
    };
    Expr.prototype.executeStepAfterEval = function(state,stackEl) {
        stackEl.nxt = this.executeStepEvalToken;
        stackEl.vals.push(state.buf);
        return true;
    };
    Expr.prototype.executeStepEvalStack = function(state,stackEl) {
        if(stackEl.vals.length && stackEl.ops.length && arrayLast(stackEl.ops).prio >= stackEl.prio) {
            var so = stackEl.ops.pop();
            var res = so.evalFunc(state,stackEl.vals);
            state.buf = new ValRef(state,ValRef.TypeValue,res);
            stackEl.vals.push(state.buf);
        }
        else
            stackEl.nxt = stackEl.retTo;
        return true;
    };
    Expr.prototype.optimize=function() {
        var res=true;
        this.qSrc = "";
        for(var i=0; i<this.childs.length; i++) {
            var c=this.childs[i];
            if(c.optimize) {
                if(!c.optimize())
                    res = false;
                if(c.t==='Expr')
                    this.qSrc+="("+c.qSrc+")";
                else
                    this.qSrc+=c.qSrc;
            }
            else
                this.qSrc+=c.src;
        }
        if(res)
            if(this.qSrc)
                eval("this.execute = function(state) {/* Expr */state.buf = new ValRef(state,ValRef.TypeValue,("+this.qSrc+"))}");
            else
                eval("this.execute = function(state) {/* Expr */}");

        return res;
    };
    Expr.simplify=function(obj) {
        var n=obj;
        while(n.children && n.t !== 'Arr' && n.t !== 'Obj' && n.children() && n.children().length===1)
            n = n.children()[0];
        return n;
    };

    var ExprTokenOp = function(clsr) {
        this.clsr = clsr;
        this.t = 'Op'
    };
    ExprTokenOp.OpTable = [
        [   function (str,idx,prev) {return prev && ch3(str,idx) === '==='},
            function (state,vals) {  return vals.pop().val() === vals.pop().val()  },
            10, 3
        ],
        [   function (str,idx,prev) {return prev && ch3(str,idx) === '!=='},
            function (state,vals) {  return vals.pop().val() !== vals.pop().val()  },
            10, 3
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '+='},
            function (state,vals) {
                var v=vals.pop();
                var to=vals.pop();
                return to.set(to.val()+v.val());
            },
            3, 2, true
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '-='},
            function (state,vals) {
                var v=vals.pop();
                var to=vals.pop();
                return to.set(to.val()-v.val());
            },
            3, 2, true
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '*='},
            function (state,vals) {
                var v=vals.pop();
                var to=vals.pop();
                return to.set(to.val()*v.val());
            },
            3, 2, true
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '/='},
            function (state,vals) {
                var v=vals.pop();
                var to=vals.pop();
                return to.set(to.val()/v.val());
            },
            3, 2, true
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '%='},
            function (state,vals) {
                var v=vals.pop();
                var to=vals.pop();
                return to.set(to.val()%v.val());
            },
            3, 2, true
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '<<'},
            function (state,vals) {
                var v=vals.pop();
                var to=vals.pop();
                return to.val()<<v.val();
            },
            12, 2, true
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '>>'},
            function (state,vals) {
                var v=vals.pop();
                var to=vals.pop();
                return to.val()>>v.val();
            },
            12, 2, true
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '&='},
            function (state,vals) {
                var v=vals.pop();
                var to=vals.pop();
                return to.set(to.val()&v.val());
            },
            3, 2, true
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '|='},
            function (state,vals) {
                var v=vals.pop();
                var to=vals.pop();
                return to.set(to.val()|v.val());
            },
            3, 2, true
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '^='},
            function (state,vals) {
                var v=vals.pop();
                var to=vals.pop();
                return to.set(to.val()^v.val());
            },
            3, 2, true
        ],
        [   function (str,idx,prev) {return (!prev || prev.t==='Op') && ch2(str,idx) === '++'},
            function (state,vals) {
                var h=vals.pop();
                return h.set(h.val()+1);
            },
            16, 2
        ],
        [   function (str,idx,prev) {return (!prev || prev.t==='Op') && ch2(str,idx) === '--'},
            function (state,vals) {
                var h=vals.pop();
                return h.set(h.val()-1);
            },
            16, 2
        ],
        [   function (str,idx,prev) {return (prev && prev.t!=='Op') && ch2(str,idx) === '++'},
            function (state,vals) {
                var h=vals.pop();
                var r=h.val();
                h.set(r+1);
                return r;
            },
            16, 2
        ],
        [   function (str,idx,prev) {return (prev && prev.t!=='Op') && ch2(str,idx) === '--'},
            function (state,vals) {
                var h=vals.pop();
                var r=h.val();
                h.set(r-1);
                return r;
            },
            16, 2
        ],
        [   function (str,idx,prev) { if(ch2(str,idx) === '=>') throw formatParseError(str,idx,"Arrow functions not implemented");},
            null,
            null, 2
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '=='},
            function (state,vals) {  return vals.pop().val() == vals.pop().val()  },
            10, 2
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '!='},
            function (state,vals) {  return vals.pop().val() != vals.pop().val()  },
            10, 2
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '&&'},
            function (state,vals) { var p=vals.pop().val(); return vals.pop().val()&&p },
            6, 2
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '||'},
            function (state,vals) { var p=vals.pop().val(); return vals.pop().val()||p },
            5, 2
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '<='},
            function (state,vals) {  return vals.pop().val() >= vals.pop().val()  },
            14, 2
        ],
        [   function (str,idx,prev) {return prev && ch2(str,idx) === '>='},
            function (state,vals) {  return vals.pop().val() <= vals.pop().val()  },
            14, 2
        ],
        [   function (str,idx,prev) {return (!prev || prev.t==='Op') && ch1(str,idx) === '!'},
            function (state,vals) {  return !vals.pop().val()  },
            16, 1
        ],
        [   function (str,idx,prev) {return (!prev || prev.t==='Op') && ch1(str,idx) === '~'},
            function (state,vals) {  return ~vals.pop().val()  },
            16, 1
        ],
        [   function (str,idx,prev) {return (!prev || prev.t==='Op') && ch1(str,idx) === '-'},
            function (state,vals) {  return -vals.pop().val()  },
            16, 1
        ],
        [   function (str,idx,prev) {return (!prev || prev.t==='Op') && ch1(str,idx) === '+'},
            function (state,val) {  return val.pop().val()  },
            16, 1
        ],
        [   function (str,idx,prev) {return prev && ch1(str,idx) === '*'},
            function (state,vals) {  return vals.pop().val()*vals.pop().val()  },
            14, 1
        ],
        [   function (str,idx,prev) {return prev && ch1(str,idx) === '/'},
            function (state,vals) { var p=vals.pop().val(); return vals.pop().val()/p  },
            14, 1
        ],
        [   function (str,idx,prev) {return prev && ch1(str,idx) === '%'},
            function (state,vals) { var p=vals.pop().val(); return vals.pop().val()%p  },
            14, 1
        ],
        [   function (str,idx,prev) {return prev && ch1(str,idx) === '+'},
            function (state,vals) {  var p=vals.pop().val(); return vals.pop().val()+p  },
            13, 1
        ],
        [   function (str,idx,prev) {return prev && ch1(str,idx) === '-'},
            function (state,vals) { var p=vals.pop().val(); return vals.pop().val()-p  },
            13, 1
        ],
        [   function (str,idx,prev) {return prev && ch1(str,idx) === '<'},
            function (state,vals) {  return vals.pop().val() > vals.pop().val()  },
            14, 1
        ],
        [   function (str,idx,prev) {return prev && ch1(str,idx) === '>'},
            function (state,vals) {  return vals.pop().val() < vals.pop().val()  },
            14, 1
        ],
        [   function (str,idx,prev) {return prev && ch1(str,idx) === '='},
            function (state,vals) {
                var v=vals.pop();
                var to=vals.pop();
                return to.set(v.val());
            },
            3, 1, true
        ],
        [   function (str,idx,prev) {return prev && ch1(str,idx) === ','},
            function (state,vals) {  var p=vals.pop().val(); vals.pop(); return p },
            0, 1
        ],
        [   function (str,idx,prev) {return prev && ch1(str,idx) === '?'},
            function (state,vals) {  var p=vals.pop().val(); vals.pop(); return p },
            4, 1
        ]
    ];
    ExprTokenOp.prototype.parse = function (str,idx, prev) {
        this.start = idx;
        for(var i = 0; i<ExprTokenOp.OpTable.length; i++) {
            var op = ExprTokenOp.OpTable[i];
            if(op[0](str,idx,prev)) {
                this.evalFunc = op[1];
                this.prio = op[2];
                idx+=op[3];
                this.assign = op[4];
                this.src = str.substr(this.start,idx-this.start);
                break;
            }
        }
        return ss(str,idx);
    };

    function skipComment(str, idx) {
        if(str.substr(idx,2) === '//') {
            idx = skipSLComment(str,idx);
        }
        else if(str.substr(idx,2) === '/*'){
            idx = skipMLComment(str,idx);
        }
        return idx;
    };

    function skipMLComment(str, idx) {
        for(idx+=2; idx < str.length; idx++)
            if(str.substr(idx,2) === "*/")
                return idx+2;
    };

    function skipSLComment(str, idx) {
        for(idx+=2; idx < str.length; idx++)
            if(ch1(str,idx) === "\n")
                return idx+1;
        return idx;
    };

    Syn._isSpace = function(s) {
        return(s===" " || s==="\t"  || s==="\n"  || s==="\r" || s==="↵");
    };

    function ss(str,idx) {
        var s;
        while(s = ch1(str,idx)) {
            if(str.substr(idx,2) === '//' || str.substr(idx,2) === '/*') {
                idx = skipComment(str,idx);
                continue;
            }
            if(!Syn._isSpace(s))
                break;
            idx++;
        }
        return idx;
    }

    function isLetter(chr) {
        return "a" <= chr && chr <= "z" ||
            "A" <= chr && chr <= "Z";
    }

    function isDigit(chr) {
        return "0" <= chr && chr <= "9";
    }

    function isVarnameBegin(chr) {
        return isLetter(chr) || chr === "$" || chr === "_"
    }

    function isVarnameCont(chr) {
        return isLetter(chr) || isDigit(chr) || chr === "$" || chr === "_"
    }

    function ch1(str,idx) {	return str.substr(idx,1) }
    function ch2(str,idx) { return str.substr(idx,2) }
    function ch3(str,idx) { return str.substr(idx,3) }

    /**
     * Synchronous run
     * @param {Function} functionPtr
     * @param userThisCtx
     * @param {Function} callback
     */
    function run(functionPtr, userThisCtx, /*param1, param2, etc*/ callback) {
        var params = Array.prototype.slice.call(arguments);
        var functionPtr = params.shift();
        var userThisCtx = params.shift() || {};
        var callback = params.pop() || function () {};
        compile(functionPtr);
        var state = new State(Syn.stateSeq, functionPtr.nsynjsBin, userThisCtx, callback, params, null,null);
        Syn.states[Syn.stateSeq++] = state;
        functionPtr.nsynjsBin.state = state;
        functionPtr.nsynjsBin.operatorBlock.execute(state);
        state.tick();
        return state;
    }

    /**
     * Compile existing function
     * @param {Function} functionPtr
     */

    function compile(functionPtr) {
        if(typeof functionPtr !== 'function')
            throw "function pointer expected";
        if(!functionPtr.nsynjsBin) {
            functionPtr.nsynjsBin = new OperandFunDef(null);
            functionPtr.nsynjsBin.parse(functionPtr.toString(),0);
            functionPtr.nsynjsBin.name = functionPtr.name;
        }
    }

    function findLine(str,idx) {
        var lines = str.split("\n");
        var prev=cur=0;
        for(var i=0; i<lines.length; i++) {
            prev = cur;
            cur += lines[i].length+1;
            if(cur>=idx) {
                var ret = {
                    currLine: lines[i].replace(/[\n\r]/g, ''),
                    carrot: (new Array(idx-prev+1).join(' '))+'^',
                    lineNo: i,
                    charNo: idx-prev+1
                };
                if(i-1>=0)
                    ret.prevLine = lines[i-1].replace(/[\n\r]/g, '');
                if(i+1<lines.length)
                    ret.nextLine = lines[i+1].replace(/[\n\r]/g, '');
                return ret;
            }
        }
    }

    function parseVarname(str,idx) {
        idx = ss(str,idx);
        var res="";
        for(var i=idx; i<str.length; i++) {
            var chr = str.charAt(i);
            if(i===idx && isVarnameBegin(chr) || i>idx && isVarnameCont(chr))
                res+=chr;
            else
                break;
        }
        return res;
    }

    function startingWith(str,idx,word) {
        return str.substr(idx,word.length) === word && !isVarnameCont(str.substr(idx+word.length,1));
    }

    function skipOptSemicolon(str, idx) {
        idx = ss(str,idx);
        if(ch1(str,idx) === ';') idx++;
        idx = ss(str,idx);
        return idx;
    };

    exports.run = run;
    exports.compile = compile;
    exports.states = Syn.states;
    exports.isRunning = Syn.isRunning;
    exports.exists = Syn.exists;
})(typeof exports === 'undefined'? this['nsynjs']={} : exports);
