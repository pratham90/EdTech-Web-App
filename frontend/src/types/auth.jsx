/**
 * @typedef {'teacher' | 'student'} UserRole
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {UserRole} role
 * @property {string} [avatar]
 */

/**
 * @typedef {Object} AuthContextType
 * @property {User|null} user
 * @property {boolean} isAuthenticated
 * @property {(email: string, password: string, role: 'teacher'|'student') => Promise<void>} login
 * @property {(email: string, password: string, name: string, role: 'teacher'|'student') => Promise<void>} signup
 * @property {() => void} logout
 * @property {boolean} loading
 */
