const burmeseNumber = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];

function confirm() {
  const word = document.getElementById('language').value;
  const box = document.getElementById('result');
  const lex = lexer(word);
  console.log('lexer', lex);
  const parse = parser(lex);
  console.log('parser', parse);
  const transform = transformer(parse);
  console.log('transformer', transform);
  const generate = generator(transform);
  console.log('generator', generate);
  // box.append(generate);
}

function lexer(code) {
  return code
    .split(/\s+/)
    .filter(function (t) {
      return t.length > 0;
    })
    .map(function (t) {
      return burmeseNumber.includes(t)
        ? { type: 'number', value: t }
        : { type: 'word', value: t };
    });
}

function parser(tokens) {
  var AST = {
    type: 'Language',
    body: [],
  };
  // extract a token at a time as current_token. Loop until we are out of tokens.
  while (tokens.length > 0) {
    var current_token = tokens.shift();

    // Since number token does not do anything by it self, we only analyze syntax when we find a word.
    if (current_token.type === 'word') {
      var expression = {
        type: 'CallExpression',
        name: current_token.value,
        arguments: [],
      };
      const argument = tokens.shift();
      switch (current_token.value) {
        case 'လုပ်ဆောင်ချက်':
          // if current token is CallExpression of type Paper, next token should be color argument
          const num = argument.value.split('');
          const value = num.map((x) => burmeseNumber.indexOf(x)).join('');
          if (argument.type === 'word') {
            expression.arguments.push({
              // add argument information to expression object
              type: 'FunctionLiteral',
              value: value,
            });
            AST.body.push(expression); // push the expression object to body of our AST
          } else {
            throw 'Word command must be followed by a number.';
          }
          break;
        case 'စာထုတ်ပါ':
          if (argument.type === 'word') {
            expression.arguments.push({
              // add argument information to expression object
              type: 'FunctionLiteral',
              value: argument.value,
            });
            AST.body.push(expression); // push the expression object to body of our AST
          }
          break;
      }
    }
  }

  return AST;
}

function transformer(ast) {
  var svg_ast = {
    tag: 'function',
    attr: {
      version: '1.1',
    },
    body: [],
  };

  // Extract a call expression at a time as `node`. Loop until we are out of expressions in body.
  while (ast.body.length > 0) {
    var node = ast.body.shift();
    switch (node.name) {
      case 'လုပ်ဆောင်ချက်':
        svg_ast.body.push({
          // add လုပ်ဆောင်ချက် element information to svg_ast's body
          tag: 'function',
          attr: {
            open: '(',
            value: node.arguments[0].value,
            close: ')',
          },
        });
        break;
      case 'စာထုတ်ပါ':
        svg_ast.body.push({
          // add စာထုတ်ပါ element information to svg_ast's body
          tag: 'console.log',
          attr: {
            open: '(',
            value: node.arguments[0].value,
            close: ')',
          },
        });
        break;
    }
  }
  return svg_ast;
}

function generator(wordAst) {
  function appendParams(node) {
    if (node.tag == 'function')
      return (
        node.tag + node.attr.open + node.attr.value + node.attr.close + ' { } '
      );
    if (node.tag == 'console.log')
      return (
        node.tag + node.attr.open + `'${node.attr.value}'` + node.attr.close
      );
  }

  // for each elements in the body of wordAst, generate svg tag
  var elements = wordAst.body
    .map(function (node) {
      return appendParams(node);
    })
    .join('\n\t');

  // wrap with open and close svg tag to complete SVG code
  return elements;
}
