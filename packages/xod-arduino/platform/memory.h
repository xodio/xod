/*=============================================================================
 *
 *
 * Functions to work with memory
 *
 *
 =============================================================================*/

// Define the placement new operator for cores that do not provide their own.
// Note, this definition takes precedence over the existing one (if any). We found no C++ way
// to use the existing implementation _and_ this implementation if not yet defined.
template<typename T>
void* operator new(size_t, T* ptr) noexcept {
    return ptr;
}
