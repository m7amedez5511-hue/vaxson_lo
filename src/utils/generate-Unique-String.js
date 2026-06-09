import { customAlphabet } from 'nanoid'

 export const generateUniqueString = (length) => {

    const nanoid = customAlphabet('12345slah.sa', length || 13)
    return nanoid()
}


