import {targets} from './test.paths.js';
import * as _ from "lodash";

describe("development target", function() {
    it("path set", function() {
        expect(!!targets.test).toBe(true);
    });
});
