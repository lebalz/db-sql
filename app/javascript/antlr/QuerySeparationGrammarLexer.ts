// Generated from app/javascript/antlr/QuerySeparationGrammar.g4 by ANTLR 4.7.3-SNAPSHOT


import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { CharStream } from "antlr4ts/CharStream";
import { Lexer } from "antlr4ts/Lexer";
import { LexerATNSimulator } from "antlr4ts/atn/LexerATNSimulator";
import { NotNull } from "antlr4ts/Decorators";
import { Override } from "antlr4ts/Decorators";
import { RuleContext } from "antlr4ts/RuleContext";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";


export class QuerySeparationGrammarLexer extends Lexer {
	public static readonly T__0 = 1;
	public static readonly CHAR = 2;
	public static readonly STRING = 3;
	public static readonly COMMENT = 4;

	// tslint:disable:no-trailing-whitespace
	public static readonly channelNames: string[] = [
		"DEFAULT_TOKEN_CHANNEL", "HIDDEN",
	];

	// tslint:disable:no-trailing-whitespace
	public static readonly modeNames: string[] = [
		"DEFAULT_MODE",
	];

	public static readonly ruleNames: string[] = [
		"T__0", "CHAR", "STRING", "COMMENT", "SIMPLE_COMMENT", "BRACKETED_COMMENT",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "';'",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, undefined, "CHAR", "STRING", "COMMENT",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(QuerySeparationGrammarLexer._LITERAL_NAMES, QuerySeparationGrammarLexer._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return QuerySeparationGrammarLexer.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace


	constructor(input: CharStream) {
		super(input);
		this._interp = new LexerATNSimulator(QuerySeparationGrammarLexer._ATN, this);
	}

	// @Override
	public get grammarFileName(): string { return "QuerySeparationGrammar.g4"; }

	// @Override
	public get ruleNames(): string[] { return QuerySeparationGrammarLexer.ruleNames; }

	// @Override
	public get serializedATN(): string { return QuerySeparationGrammarLexer._serializedATN; }

	// @Override
	public get channelNames(): string[] { return QuerySeparationGrammarLexer.channelNames; }

	// @Override
	public get modeNames(): string[] { return QuerySeparationGrammarLexer.modeNames; }

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x02\x06=\b\x01\x04" +
		"\x02\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04" +
		"\x07\t\x07\x03\x02\x03\x02\x03\x03\x03\x03\x03\x04\x03\x04\x03\x04\x03" +
		"\x04\x07\x04\x18\n\x04\f\x04\x0E\x04\x1B\v\x04\x03\x04\x03\x04\x03\x05" +
		"\x03\x05\x05\x05!\n\x05\x03\x06\x03\x06\x03\x06\x03\x06\x07\x06\'\n\x06" +
		"\f\x06\x0E\x06*\v\x06\x03\x06\x05\x06-\n\x06\x03\x06\x05\x060\n\x06\x03" +
		"\x07\x03\x07\x03\x07\x03\x07\x07\x076\n\x07\f\x07\x0E\x079\v\x07\x03\x07" +
		"\x03\x07\x03\x07\x037\x02\x02\b\x03\x02\x03\x05\x02\x04\x07\x02\x05\t" +
		"\x02\x06\v\x02\x02\r\x02\x02\x03\x02\x05\x03\x02==\x03\x02))\x04\x02\f" +
		"\f\x0F\x0F\x02A\x02\x03\x03\x02\x02\x02\x02\x05\x03\x02\x02\x02\x02\x07" +
		"\x03\x02\x02\x02\x02\t\x03\x02\x02\x02\x03\x0F\x03\x02\x02\x02\x05\x11" +
		"\x03\x02\x02\x02\x07\x13\x03\x02\x02\x02\t \x03\x02\x02\x02\v\"\x03\x02" +
		"\x02\x02\r1\x03\x02\x02\x02\x0F\x10\x07=\x02\x02\x10\x04\x03\x02\x02\x02" +
		"\x11\x12\n\x02\x02\x02\x12\x06\x03\x02\x02\x02\x13\x19\x07)\x02\x02\x14" +
		"\x18\n\x03\x02\x02\x15\x16\x07)\x02\x02\x16\x18\x07)\x02\x02\x17\x14\x03" +
		"\x02\x02\x02\x17\x15\x03\x02\x02\x02\x18\x1B\x03\x02\x02\x02\x19\x17\x03" +
		"\x02\x02\x02\x19\x1A\x03\x02\x02\x02\x1A\x1C\x03\x02\x02\x02\x1B\x19\x03" +
		"\x02\x02\x02\x1C\x1D\x07)\x02\x02\x1D\b\x03\x02\x02\x02\x1E!\x05\v\x06" +
		"\x02\x1F!\x05\r\x07\x02 \x1E\x03\x02\x02\x02 \x1F\x03\x02\x02\x02!\n\x03" +
		"\x02\x02\x02\"#\x07/\x02\x02#$\x07/\x02\x02$(\x03\x02\x02\x02%\'\n\x04" +
		"\x02\x02&%\x03\x02\x02\x02\'*\x03\x02\x02\x02(&\x03\x02\x02\x02()\x03" +
		"\x02\x02\x02),\x03\x02\x02\x02*(\x03\x02\x02\x02+-\x07\x0F\x02\x02,+\x03" +
		"\x02\x02\x02,-\x03\x02\x02\x02-/\x03\x02\x02\x02.0\x07\f\x02\x02/.\x03" +
		"\x02\x02\x02/0\x03\x02\x02\x020\f\x03\x02\x02\x0212\x071\x02\x0223\x07" +
		",\x02\x0237\x03\x02\x02\x0246\v\x02\x02\x0254\x03\x02\x02\x0269\x03\x02" +
		"\x02\x0278\x03\x02\x02\x0275\x03\x02\x02\x028:\x03\x02\x02\x0297\x03\x02" +
		"\x02\x02:;\x07,\x02\x02;<\x071\x02\x02<\x0E\x03\x02\x02\x02\n\x02\x17" +
		"\x19 (,/7\x02";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!QuerySeparationGrammarLexer.__ATN) {
			QuerySeparationGrammarLexer.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(QuerySeparationGrammarLexer._serializedATN));
		}

		return QuerySeparationGrammarLexer.__ATN;
	}

}

