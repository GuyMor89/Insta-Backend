import { authHandler } from '../api/auth/auth.handler.js'
import { asyncLocalStorage } from '../services/als.service.js'

export async function setupAsyncLocalStorage(req, res, next) {
	if (!req.cookies?.loginToken) return next()
		
	const storage = {}
    
	asyncLocalStorage.run(storage, () => {
		const loggedinUser = authHandler.validateToken(req.cookies.loginToken)

		if (loggedinUser) {
			const alsStore = asyncLocalStorage.getStore()
			alsStore.loggedinUser = loggedinUser
		}
		next()
	})
}
