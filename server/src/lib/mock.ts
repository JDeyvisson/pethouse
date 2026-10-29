// Mock flows never send mail or charge money; production cannot enable them.
export const mockServices = () => process.env.MOCK_SERVICES === 'true' && process.env.NODE_ENV !== 'production'
