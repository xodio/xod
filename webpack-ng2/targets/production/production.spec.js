import {targets} from './production.paths.js';
import * as _ from "lodash";

describe("production target", function() {
    it("path set", function() {
        expect(_.findIndex(targets, (target) => {
                return !!target.production;
            }) !== -1).toBe(true);
    });
});