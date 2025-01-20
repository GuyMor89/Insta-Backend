import { asyncLocalStorage } from '../services/als.service.js'
import { logger } from '../services/logger.service.js'

const isGuestMode = true

export function requireAuth(req, res, next) {
	const { loggedInUser } = asyncLocalStorage.getStore()
	req.loggedInUser = loggedInUser

	if (isGuestMode && !loggedInUser) {
		req.loggedInUser = { _id: '', fullname: 'Guest' }
		return next()
	}
	if (!loggedInUser) return res.status(401).send('Not Authenticated')
	next()
}

export function requireAdmin(req, res, next) {
	const { loggedInUser } = asyncLocalStorage.getStore()
    
	if (!loggedInUser) return res.status(401).send('Not Authenticated')
		
	if (!loggedInUser.isAdmin) {
		logger.warn(loggedInUser.fullname + 'attempted to perform admin action')
		res.status(403).end('Not Authorized')
		return
	}
	next()
}
