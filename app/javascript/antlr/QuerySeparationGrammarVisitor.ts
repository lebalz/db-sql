// Generated from app/javascript/antlr/QuerySeparationGrammar.g4 by ANTLR 4.7.3-SNAPSHOT


import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";

import { QueriesTextContext } from "./QuerySeparationGrammarParser";
import { StatementContext } from "./QuerySeparationGrammarParser";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `QuerySeparationGrammarParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export interface QuerySeparationGrammarVisitor<Result> extends ParseTreeVisitor<Result> {
	/**
	 * Visit a parse tree produced by `QuerySeparationGrammarParser.queriesText`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitQueriesText?: (ctx: QueriesTextContext) => Result;

	/**
	 * Visit a parse tree produced by `QuerySeparationGrammarParser.statement`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitStatement?: (ctx: StatementContext) => Result;
}

