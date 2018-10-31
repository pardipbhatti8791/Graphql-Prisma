import bcrypt from 'bcryptjs'
import getUserId from '../utils/getUserId'
import generateToken from '../utils/generateToken'
import hashPassword from '../utils/hashPassword'

const Mutation = {
    async createUser(parent, args, { prisma }, info) {
        const hashedPassword = await hashPassword(args.data.password)
        const user = await prisma.mutation.createUser({
            data: {
                ...args.data,
                password: hashedPassword
            }
        })

        return {
            user: user,
            token: generateToken(user.id)
        }
    },
    async login(parent, args, { prisma }, info) {
        const user = await prisma.query.user({
            where: {
                email: args.data.email
            }
        })

        if(!user) {
            throw new Error('Invalid email/password')
        }

        const isMatch = await bcrypt.compare(args.data.password, user.password)
        if(!isMatch) {
            throw new Error('Invalid email/password')
        }

        return {
            user,
            token: generateToken(user.id)
        }

    },
    async deleteUser(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)

        return prisma.mutation.deleteUser({
            where: {
                id: userId
            }
        }, info)
    },
    async updateUser(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
        return prisma.mutation.updateUser({
            where: {
                id: userId
            },
            data: args.data
        }, info)
    },
    async createPost(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
        const post = prisma.mutation.createPost({
            data: {
                title: args.data.title,
                body: args.data.body,
                published: args.data.published,
                author: {
                    connect: {
                        id: userId
                    }
                }
            }
        }, info)

        return post;
    },
    async deletePost(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
        const postExists = await prisma.exists.Post({
            id: args.id,
            author: {
                id: userId
            }
        })
        if(!postExists) {
            throw new Error('Unable to delete post')
        }

        return prisma.mutation.deletePost({
            where: {
                id: args.id
            }
        }, info)
    },
    async updatePost(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)

        if(typeof args.data.password === 'string') {
            args.data.password = await hashPassword(args.data.password)
        }

        const postExist = await prisma.exists.Post({
            id: args.id,
            author: {
                id: userId
            }
        })
        if(!postExist) {
            throw new Error('Unable to update post')
        }

        return prisma.mutation.updatePost({
            where: {
                id: args.id
            },
            data: args.data
        }, info)
    },
    async createComment(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
        const postExists = await prisma.exists.Post({
            id: args.data.post,
            published: true
        })

        if (!postExists) {
            throw new Error('Post not exist')
        }
        
        return prisma.mutation.createComment({
            data: {
                text: args.data.text,
                author: {
                    connect: {
                        id: userId
                    }
                },
                post: {
                    connect: {
                        id: args.data.post
                    }
                }
            }
        }, info)
    },
    async deleteComment(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
        const commentExist = await prisma.exists.Comment({
            id: args.id,
            author: {
                id: userId
            }
        })
        if(!commentExist) {
            throw new Error('Unable to delete comment')
        }
        return prisma.mutation.deleteComment({
            where: {
                id: args.id
            }
        }, info)
    },
    async updateComment(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
        const commentExist = await prisma.exists.Comment({
            id: args.id,
            author: {
                id: userId
            }
        })
        if(!commentExist) {
            throw new Error('Unable to delete comment')
        }
        return prisma.mutation.updateComment({
            where: {
                id: args.id
            },
            data: args.data
        }, info)
    }
}

export { Mutation as default }