
/*
import * as ts from 'typescript'
import { Step } from '../../Step'

function nodeChildren(node) {
    const children = [];
    node.forEachChild(child => children.push(child));
    return children;
}

export function listImports(step: Step) {

    const filename = step.get('filename');

    const program = ts.createProgram([filename], {});
    const source = program.getSourceFile(filename);
    const printer = ts.createPrinter();

    source.forEachChild(importNode => {
        //console.log(importNode.kind, ' ', ts.SyntaxKind.ImportDeclaration)
        //console.log(ts.SyntaxKind[importNode.kind])

        if (importNode.kind === ts.SyntaxKind.ImportDeclaration) {
            console.log(nodeChildren(importNode));
            const [path] = nodeChildren(importNode).filter(node => node.kind === 10);

            step.put({ filename: path.text });
            importNode.forEachChild(cc => console.log(cc))
        }
    });

    // console.log('source = ', source)
    // console.log(source.statements[1].importClause)
}
*/

export {}

/*
if (require.main === module) {
    const step = new Step();
    listImports(process.argv[2]);
}
*/
