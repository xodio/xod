
import AjaxNodeRepository from '../dao/nodes';
import Patch from '../models/patch';

export function loadPatch(url, callback) {
  d3.json(url, (json) => {
    let nodeRepository = new AjaxNodeRepository();
    nodeRepository.prefetch(Patch.nodeTypes(json), (err) => {
      if (err) {
        callback(err, patch);
        return;
      }

      let patch = new Patch(json, nodeRepository);
      callback(null, patch);
    });
  });
}
