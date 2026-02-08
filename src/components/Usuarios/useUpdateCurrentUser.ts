/**
 * Utilidad para sincronizar datos del usuario logueado en localStorage
 * cuando se actualizan desde la sección de usuarios
 */

interface CurrentUser {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  [key: string]: unknown;
}

/**
 * Actualiza el usuario en localStorage si el ID coincide con el usuario actual logueado
 * @param updatedUserId - ID del usuario que fue actualizado
 * @param updatedData - Datos actualizados del usuario
 * @returns true si se actualizó localStorage, false si no aplica
 */
export const updateCurrentUserLoggedIn = (
  updatedUserId: number,
  updatedData: {
    nombre?: string;
    correo?: string;
    rol?: string;
    estado?: string;
  },
): boolean => {
  try {
    // Obtener usuario actual del localStorage
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      console.warn("No hay usuario en localStorage para actualizar");
      return false;
    }

    const currentUser: CurrentUser = JSON.parse(storedUser);

    // Verificar si el usuario actualizado es el usuario logueado actual
    if (currentUser.id !== updatedUserId) {
      // No es el usuario actual, no se actualiza
      return false;
    }

    // Actualizar los campos que coincidan
    const updatedUser = { ...currentUser };

    if (updatedData.nombre !== undefined) {
      updatedUser.nombre = updatedData.nombre;
    }
    if (updatedData.correo !== undefined) {
      updatedUser.correo = updatedData.correo;
    }
    if (updatedData.rol !== undefined) {
      updatedUser.rol = updatedData.rol;
    }
    if (updatedData.estado !== undefined) {
      updatedUser.estado = updatedData.estado;
    }

    // Guardar usuario actualizado en localStorage
    localStorage.setItem("user", JSON.stringify(updatedUser));

    console.log(
      "✅ Usuario logueado actualizado en localStorage:",
      updatedUser,
    );
    return true;
  } catch (error) {
    console.error("Error actualizando usuario en localStorage:", error);
    return false;
  }
};

/**
 * Obtiene el ID del usuario actualmente logueado
 * @returns ID del usuario o null si no hay usuario logueado
 */
export const getCurrentUserId = (): number | null => {
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    const currentUser: CurrentUser = JSON.parse(storedUser);
    return currentUser.id || null;
  } catch (error) {
    console.error("Error obteniendo ID del usuario actual:", error);
    return null;
  }
};
