import TokenDef from './TokenDef';
export declare const t_lparen: TokenDef;
export declare const t_rparen: TokenDef;
export declare const t_lbracket: TokenDef;
export declare const t_rbracket: TokenDef;
export declare const t_lbrace: TokenDef;
export declare const t_rbrace: TokenDef;
export declare const t_gthan: TokenDef;
export declare const t_gthaneq: TokenDef;
export declare const t_lthan: TokenDef;
export declare const t_lthaneq: TokenDef;
export declare const t_slash: {
    name: string;
    str: string;
};
export declare const t_dot: {
    name: string;
    str: string;
};
export declare const t_comma: {
    name: string;
    str: string;
};
export declare const t_semicolon: {
    name: string;
    str: string;
};
export declare const t_colon: {
    name: string;
    str: string;
};
export declare const t_plus: {
    name: string;
    str: string;
};
export declare const t_dash: {
    name: string;
    str: string;
};
export declare const t_double_dash: {
    name: string;
    str: string;
};
export declare const t_right_arrow: {
    name: string;
    str: string;
};
export declare const t_right_fat_arrow: {
    name: string;
    str: string;
};
export declare const t_star: {
    name: string;
    str: string;
};
export declare const t_equals: {
    name: string;
    str: string;
};
export declare const t_double_equals: {
    name: string;
    str: string;
};
export declare const t_hash: {
    name: string;
    str: string;
};
export declare const t_percent: {
    name: string;
    str: string;
};
export declare const t_dollar: {
    name: string;
    str: string;
};
export declare const t_tilde: {
    name: string;
    str: string;
};
export declare const t_exclaim: {
    name: string;
    str: string;
};
export declare const t_bar: {
    name: string;
    str: string;
};
export declare const t_double_bar: {
    name: string;
    str: string;
};
export declare const t_amp: {
    name: string;
    str: string;
};
export declare const t_double_amp: {
    name: string;
    str: string;
};
export declare const t_question: {
    name: string;
    str: string;
};
export declare const t_ident: {
    name: string;
};
export declare const t_plain_value: {
    name: string;
};
export declare const t_integer: {
    name: string;
};
export declare const t_space: {
    name: string;
};
export declare const t_newline: {
    name: string;
    str: string;
};
export declare const t_quoted_string: {
    name: string;
};
export declare const t_line_comment: {
    name: string;
};
export declare const t_unrecognized: {
    name: string;
};
export declare const everyToken: TokenDef[];
export declare const tokenFromSingleCharCode: {
    [code: string]: TokenDef;
};
