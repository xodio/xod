import {targets} from './production.paths.js';
import * as _ from "lodash";

describe("production target", function() {
    it("path set", function() {
        expect(!!targets.production).toBe(true);
    });
});
