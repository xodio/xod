import { assert } from 'chai';

import * as XP from '../src';

describe('Comment', () => {
  describe('createComment', () => {
    it('should create Comment with specified position, size and content', () => {
      const position = { x: 123, y: 456 };
      const size = { width: 345, height: 678 };
      const content = 'test comment content';

      const comment = XP.createComment(position, size, content);

      assert.deepEqual(XP.getCommentPosition(comment), position);

      assert.deepEqual(XP.getCommentSize(comment), size);

      assert.equal(XP.getCommentContent(comment), content);
    });
  });

  describe('setters', () => {
    const defaultComment = XP.createComment(
      { x: 0, y: 0 },
      { width: 0, height: 0 },
      ''
    );

    describe('setCommentId', () => {
      it('should return a new Comment with a specified CommentId', () => {
        const newId = 'new_id';
        const newComment = XP.setCommentId(newId, defaultComment);

        assert.deepEqual(XP.getCommentId(newComment), newId);
      });
    });

    describe('setCommentPosition', () => {
      it('should return a new Comment with a specified Position', () => {
        const newPosition = { x: 5, y: 15 };
        const newComment = XP.setCommentPosition(newPosition, defaultComment);

        assert.deepEqual(XP.getCommentPosition(newComment), newPosition);
      });
    });

    describe('setCommentSize', () => {
      it('should return a new Comment with a specified Size', () => {
        const newSize = { width: 4, height: 10 };
        const newComment = XP.setCommentSize(newSize, defaultComment);

        assert.deepEqual(XP.getCommentSize(newComment), newSize);
      });
    });

    describe('setCommentContent', () => {
      it('should return a new Comment with a specified Content', () => {
        const newContent = 'newContent';
        const newComment = XP.setCommentContent(newContent, defaultComment);

        assert.deepEqual(XP.getCommentContent(newComment), newContent);
      });
    });
  });
});
