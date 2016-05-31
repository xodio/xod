import {sources} from './shared.paths.js';

describe("project", function() {
    it("path set", function() {
        expect(!!sources).toBe(true);
    });
});