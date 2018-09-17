/*=============================================================================
 *
 *
 * Functions to work with memory
 *
 *
 =============================================================================*/
#ifdef __AVR__
// Placement `new` for Arduino
void* operator new(size_t, void* ptr) {
    return ptr;
}
#endif
