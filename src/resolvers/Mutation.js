import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import getUserId from '../utils/getUserId'

const Mutation = {
    async createUser(parent, args, { prisma }, info) {
        if (args.data.password.length < 8) {
            throw new Error('Passowrd must be 8 character or longer')
        }

        const hashedPassword = await bcrypt.hash(args.data.password, 10)
        const user = await prisma.mutation.createUser({
            data: {
                ...args.data,
                password: hashedPassword
            }
        })

        return {
            user: user,
            token: jwt.sign({ userId: user.id}, 'myscrent')
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
            token: jwt.sign({ userId: user.id }, 'myscrent')
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
    createComment(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
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