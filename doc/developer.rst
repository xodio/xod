********************************
Platform Developer Documentation
********************************

Client Class Diagram
====================

.. uml::

   Dispatcher --> Renderer
   Dispatcher --> Component
   Dispatcher --> Action
   Dispatcher --> Service
   Dispatcher <-- Service
   Dispatcher o-- History
   Action --> Service
   Action --> Model
   Renderer --> Model

User Action Reaction
====================

Here is sequence of actions overview which happen when
the user interacts with a visual element on patch canvas,
e.g. he clicks a pin.

.. uml:: 

   Component  --> Dispatcher: event with params
   loop actions
       Dispatcher  -> Action: do(dataState)
       Dispatcher <-- Action: newDataState
   end
   Dispatcher  -> Dispatcher: pushHistory(newDataState)
   Dispatcher  -> Service: updateState(newDataState)
   Dispatcher  -> Renderer: render(newDataState)
   Dispatcher <-- Renderer: newViewState
   loop components involved
       Dispatcher  -> Component: updateState(newViewState)
   end
