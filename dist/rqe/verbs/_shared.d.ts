import { Step } from '../Step';
export interface Verb {
    name?: string;
    run?: (step: Step) => void;
}
