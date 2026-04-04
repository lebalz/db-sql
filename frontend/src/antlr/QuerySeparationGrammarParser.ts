// Generated from app/javascript/antlr/QuerySeparationGrammar.g4 by ANTLR 4.7.3-SNAPSHOT


import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { FailedPredicateException } from "antlr4ts/FailedPredicateException";
import { NotNull } from "antlr4ts/Decorators";
import { NoViableAltException } from "antlr4ts/NoViableAltException";
import { Override } from "antlr4ts/Decorators";
import { Parser } from "antlr4ts/Parser";
import { ParserRuleContext } from "antlr4ts/ParserRuleContext";
import { ParserATNSimulator } from "antlr4ts/atn/ParserATNSimulator";
import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";
import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";
import { RecognitionException } from "antlr4ts/RecognitionException";
import { RuleContext } from "antlr4ts/RuleContext";
//import { RuleVersion } from "antlr4ts/RuleVersion";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { Token } from "antlr4ts/Token";
import { TokenStream } from "antlr4ts/TokenStream";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";

import { QuerySeparationGrammarListener } from "./QuerySeparationGrammarListener";
import { QuerySeparationGrammarVisitor } from "./QuerySeparationGrammarVisitor";


export class QuerySeparationGrammarParser extends Parser {
	public static readonly T__0 = 1;
	public static readonly CHAR = 2;
	public static readonly STRING = 3;
	public static readonly COMMENT = 4;
	public static readonly RULE_queriesText = 0;
	public static readonly RULE_statement = 1;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"queriesText", "statement",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "';'",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, undefined, "CHAR", "STRING", "COMMENT",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(QuerySeparationGrammarParser._LITERAL_NAMES, QuerySeparationGrammarParser._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return QuerySeparationGrammarParser.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace

	// @Override
	public get grammarFileName(): string { return "QuerySeparationGrammar.g4"; }

	// @Override
	public get ruleNames(): string[] { return QuerySeparationGrammarParser.ruleNames; }

	// @Override
	public get serializedATN(): string { return QuerySeparationGrammarParser._serializedATN; }

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(QuerySeparationGrammarParser._ATN, this);
	}
	// @RuleVersion(0)
	public queriesText(): QueriesTextContext {
		let _localctx: QueriesTextContext = new QueriesTextContext(this._ctx, this.state);
		this.enterRule(_localctx, 0, QuerySeparationGrammarParser.RULE_queriesText);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 7;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << QuerySeparationGrammarParser.T__0) | (1 << QuerySeparationGrammarParser.CHAR) | (1 << QuerySeparationGrammarParser.STRING) | (1 << QuerySeparationGrammarParser.COMMENT))) !== 0)) {
				{
				{
				this.state = 4;
				this.statement();
				}
				}
				this.state = 9;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 10;
			this.match(QuerySeparationGrammarParser.EOF);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public statement(): StatementContext {
		let _localctx: StatementContext = new StatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, QuerySeparationGrammarParser.RULE_statement);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 15;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === QuerySeparationGrammarParser.T__0) {
				{
				{
				this.state = 12;
				this.match(QuerySeparationGrammarParser.T__0);
				}
				}
				this.state = 17;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 19;
			this._errHandler.sync(this);
			_alt = 1;
			do {
				switch (_alt) {
				case 1:
					{
					{
					this.state = 18;
					_la = this._input.LA(1);
					if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << QuerySeparationGrammarParser.CHAR) | (1 << QuerySeparationGrammarParser.STRING) | (1 << QuerySeparationGrammarParser.COMMENT))) !== 0))) {
					this._errHandler.recoverInline(this);
					} else {
						if (this._input.LA(1) === Token.EOF) {
							this.matchedEOF = true;
						}

						this._errHandler.reportMatch(this);
						this.consume();
					}
					}
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				this.state = 21;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 2, this._ctx);
			} while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER);
			this.state = 26;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 3, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 23;
					this.match(QuerySeparationGrammarParser.T__0);
					}
					}
				}
				this.state = 28;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 3, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03\x06 \x04\x02" +
		"\t\x02\x04\x03\t\x03\x03\x02\x07\x02\b\n\x02\f\x02\x0E\x02\v\v\x02\x03" +
		"\x02\x03\x02\x03\x03\x07\x03\x10\n\x03\f\x03\x0E\x03\x13\v\x03\x03\x03" +
		"\x06\x03\x16\n\x03\r\x03\x0E\x03\x17\x03\x03\x07\x03\x1B\n\x03\f\x03\x0E" +
		"\x03\x1E\v\x03\x03\x03\x02\x02\x02\x04\x02\x02\x04\x02\x02\x03\x03\x02" +
		"\x04\x06\x02!\x02\t\x03\x02\x02\x02\x04\x11\x03\x02\x02\x02\x06\b\x05" +
		"\x04\x03\x02\x07\x06\x03\x02\x02\x02\b\v\x03\x02\x02\x02\t\x07\x03\x02" +
		"\x02\x02\t\n\x03\x02\x02\x02\n\f\x03\x02\x02\x02\v\t\x03\x02\x02\x02\f" +
		"\r\x07\x02\x02\x03\r\x03\x03\x02\x02\x02\x0E\x10\x07\x03\x02\x02\x0F\x0E" +
		"\x03\x02\x02\x02\x10\x13\x03\x02\x02\x02\x11\x0F\x03\x02\x02\x02\x11\x12" +
		"\x03\x02\x02\x02\x12\x15\x03\x02\x02\x02\x13\x11\x03\x02\x02\x02\x14\x16" +
		"\t\x02\x02\x02\x15\x14\x03\x02\x02\x02\x16\x17\x03\x02\x02\x02\x17\x15" +
		"\x03\x02\x02\x02\x17\x18\x03\x02\x02\x02\x18\x1C\x03\x02\x02\x02\x19\x1B" +
		"\x07\x03\x02\x02\x1A\x19\x03\x02\x02\x02\x1B\x1E\x03\x02\x02\x02\x1C\x1A" +
		"\x03\x02\x02\x02\x1C\x1D\x03\x02\x02\x02\x1D\x05\x03\x02\x02\x02\x1E\x1C" +
		"\x03\x02\x02\x02\x06\t\x11\x17\x1C";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!QuerySeparationGrammarParser.__ATN) {
			QuerySeparationGrammarParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(QuerySeparationGrammarParser._serializedATN));
		}

		return QuerySeparationGrammarParser.__ATN;
	}

}

export class QueriesTextContext extends ParserRuleContext {
	public EOF(): TerminalNode { return this.getToken(QuerySeparationGrammarParser.EOF, 0); }
	public statement(): StatementContext[];
	public statement(i: number): StatementContext;
	public statement(i?: number): StatementContext | StatementContext[] {
		if (i === undefined) {
			return this.getRuleContexts(StatementContext);
		} else {
			return this.getRuleContext(i, StatementContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return QuerySeparationGrammarParser.RULE_queriesText; }
	// @Override
	public enterRule(listener: QuerySeparationGrammarListener): void {
		if (listener.enterQueriesText) {
			listener.enterQueriesText(this);
		}
	}
	// @Override
	public exitRule(listener: QuerySeparationGrammarListener): void {
		if (listener.exitQueriesText) {
			listener.exitQueriesText(this);
		}
	}
	// @Override
	public accept<Result>(visitor: QuerySeparationGrammarVisitor<Result>): Result {
		if (visitor.visitQueriesText) {
			return visitor.visitQueriesText(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class StatementContext extends ParserRuleContext {
	public CHAR(): TerminalNode[];
	public CHAR(i: number): TerminalNode;
	public CHAR(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(QuerySeparationGrammarParser.CHAR);
		} else {
			return this.getToken(QuerySeparationGrammarParser.CHAR, i);
		}
	}
	public STRING(): TerminalNode[];
	public STRING(i: number): TerminalNode;
	public STRING(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(QuerySeparationGrammarParser.STRING);
		} else {
			return this.getToken(QuerySeparationGrammarParser.STRING, i);
		}
	}
	public COMMENT(): TerminalNode[];
	public COMMENT(i: number): TerminalNode;
	public COMMENT(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(QuerySeparationGrammarParser.COMMENT);
		} else {
			return this.getToken(QuerySeparationGrammarParser.COMMENT, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return QuerySeparationGrammarParser.RULE_statement; }
	// @Override
	public enterRule(listener: QuerySeparationGrammarListener): void {
		if (listener.enterStatement) {
			listener.enterStatement(this);
		}
	}
	// @Override
	public exitRule(listener: QuerySeparationGrammarListener): void {
		if (listener.exitStatement) {
			listener.exitStatement(this);
		}
	}
	// @Override
	public accept<Result>(visitor: QuerySeparationGrammarVisitor<Result>): Result {
		if (visitor.visitStatement) {
			return visitor.visitStatement(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


