/*=============================================================================
 *
 *
 * Functions to work with memory
 *
 *
 =============================================================================*/

// Placement `new` for Arduino
void* operator new(size_t, void* ptr) {
    return ptr;
}
