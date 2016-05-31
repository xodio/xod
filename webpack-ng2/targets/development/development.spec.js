import {targets} from './development.paths.js';
import * as _ from "lodash";

describe("development target", function() {
    it("path set", function() {
        expect(_.findIndex(targets, (target) => {
            return !!target.development;
        }) !== -1).toBe(true);
    });
});