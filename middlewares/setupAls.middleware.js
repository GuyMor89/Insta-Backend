import { authHandler } from '../api/auth/auth.handler.js'
import { asyncLocalStorage } from '../services/als.service.js'

export async function setupAsyncLocalStorage(req, res, next) {
	if (!req.cookies?.loginToken) return next()
		
	const storage = {}
    
	asyncLocalStorage.run(storage, () => {
		const loggedInUser = authHandler.validateToken(req.cookies.loginToken)

		if (loggedInUser) {
			const alsStore = asyncLocalStorage.getStore()
			alsStore.loggedInUser = loggedInUser
		}
		next()
	})
}
