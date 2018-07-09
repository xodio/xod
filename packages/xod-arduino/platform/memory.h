/*=============================================================================
 *
 *
 * Functions to work with memory
 *
 *
 =============================================================================*/
#ifndef XOD_NO_PLACEMENT_NEW
// Placement `new` for Arduino
void* operator new(size_t, void* ptr) {
    return ptr;
}
#endif
