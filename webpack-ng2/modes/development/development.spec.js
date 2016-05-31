import {targets} from './development.paths.js';
import * as _ from "lodash";

describe("development target", function() {
    it("path set", function() {
        expect(!!targets.development).toBe(true);
    });
});
