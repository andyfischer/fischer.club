
import { Step } from '../Step'
// import * as fs from 'fs'
// import { formatAsCsv } from '../format/csv'

function run(step: Step) {
    if (step.schemaOnly) {
        step.output.done();
        return;
    }

    const { filename } = step.argsQuery().toItemValue();
    if (!filename)
        throw new Error('save_to_csv requires: filename');

    throw new Error('save_to_csv: need to update to not call "fs"');

    /*
    step.input.then(result => {

        const out = fs.createWriteStream(filename);
        
        for (const line of formatAsCsv(result, {
            attrs: result.getEffectiveAttrs(),
            includeHeader: true
        })) {
            out.write(line);
        }

        out.end();

        step.output.done();
    });
    */
}

export const save_to_csv = {
    run,
}

