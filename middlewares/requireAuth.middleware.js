import { asyncLocalStorage } from '../services/als.service.js'
import { logger } from '../services/logger.service.js'

const isGuestMode = true

export function requireAuth(req, res, next) {
	const { loggedinUser } = asyncLocalStorage.getStore()
	req.loggedinUser = loggedinUser

	if (isGuestMode && !loggedinUser) {
		req.loggedinUser = { _id: '', fullname: 'Guest' }
		return next()
	}
	if (!loggedinUser) return res.status(401).send('Not Authenticated')
	next()
}

export function requireAdmin(req, res, next) {
	const { loggedinUser } = asyncLocalStorage.getStore()
    
	if (!loggedinUser) return res.status(401).send('Not Authenticated')
		
	if (!loggedinUser.isAdmin) {
		logger.warn(loggedinUser.fullname + 'attempted to perform admin action')
		res.status(403).end('Not Authorized')
		return
	}
	next()
}
