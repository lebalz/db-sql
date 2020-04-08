// Generated from app/javascript/antlr/QuerySeparationGrammar.g4 by ANTLR 4.7.3-SNAPSHOT


import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";

import { QueriesTextContext } from "./QuerySeparationGrammarParser";
import { StatementContext } from "./QuerySeparationGrammarParser";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `QuerySeparationGrammarParser`.
 */
export interface QuerySeparationGrammarListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by `QuerySeparationGrammarParser.queriesText`.
	 * @param ctx the parse tree
	 */
	enterQueriesText?: (ctx: QueriesTextContext) => void;
	/**
	 * Exit a parse tree produced by `QuerySeparationGrammarParser.queriesText`.
	 * @param ctx the parse tree
	 */
	exitQueriesText?: (ctx: QueriesTextContext) => void;

	/**
	 * Enter a parse tree produced by `QuerySeparationGrammarParser.statement`.
	 * @param ctx the parse tree
	 */
	enterStatement?: (ctx: StatementContext) => void;
	/**
	 * Exit a parse tree produced by `QuerySeparationGrammarParser.statement`.
	 * @param ctx the parse tree
	 */
	exitStatement?: (ctx: StatementContext) => void;
}

