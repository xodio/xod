namespace xod {
namespace mutex {
    using NodeId = uint16_t;
    /*
      Represents some resource that should be owned/controlled exclusively by a node
      to perform a non-instant task.

      An example is a node which slowly rotates a motor shaft. The process is long
      (several seconds) and a particular rotation node can lock the motor resource
      so that other sibling rotation nodes can’t cause a conflict until the job is
      done and the motor resource is unlocked.
    */
    class Mutex {
      public:
        static constexpr NodeId NO_LOCK = 0xFFFF;

        bool lockFor(NodeId nodeId) {
            if (isLocked())
                return false;

            _lockedFor = nodeId;
            return true;
        }

        bool unlock(NodeId nodeId) {
            if (!isLockedFor(nodeId))
                return false;

            forceUnlock();
            return true;
        }

        void forceUnlock() {
            _lockedFor = NO_LOCK;
        }

        bool isLocked() const {
            return _lockedFor != NO_LOCK;
        }

        bool isLockedFor(NodeId nodeId) const {
            return _lockedFor == nodeId;
        }

      protected:
        NodeId _lockedFor = NO_LOCK;
    };
} // namespace mutex
} // namespace xod

node {
    meta {
      using Type = xod::mutex::Mutex*;
    }

    xod::mutex::Mutex mux;

    void evaluate(Context ctx) {
        emitValue<output_OUT>(ctx, &mux);
    }
}
