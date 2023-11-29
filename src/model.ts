/*
======== MODELS ==========
 * Election
 * Candidate
 * Voter
*/

export class Election {
  id: number
  name: string
  startsAt: bigint
  endsAt: bigint
  candidates: Candidate[]
  totalVotes: number
  voters: string[]

  constructor({ endsAt, id, name, startsAt, candidates, totalVotes, voters }: Election) {
    this.id = id
    this.endsAt = endsAt
    this.name = name
    this.startsAt = startsAt
    this.totalVotes = totalVotes
    this.candidates = candidates
    this.voters = voters
  }
}

export class Candidate {
  accountId: string
  totalVotes: number

  constructor({ accountId }: Candidate) {
    this.accountId = accountId
    this.totalVotes = 0
  }
}

export class Voter {
  accountId: string
  votedCandidateAccountId: string
  votedAt: bigint

  constructor({ accountId,  votedCandidateAccountId, votedAt }: Voter) {
    this.accountId = accountId
    this.votedCandidateAccountId = votedCandidateAccountId
    this.votedAt = votedAt
  }
}