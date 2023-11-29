export interface PostProps {
  timestamp: bigint
  author: string
  content: string
}

export interface UserProps {
  username: string
  friends: UserProps[]
  posts: PostProps[]
}