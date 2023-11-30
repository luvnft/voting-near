// Find all our documentation at https://docs.near.org
import { NearBindgen, near, call, view, initialize, UnorderedMap, Vector, assert } from 'near-sdk-js';
import { Candidate, Election, Voter } from './model';

/*
============= REQUIREMENTS =============
  ** ELECTIONS
    - Create Election
    - Create candidate + Add candidate

  ** CANDIDATES
    - Create candidate
    - List all candidates
    - List candidates in election

  ** VOTING
    - authenticate with near wallet
    - Vote in candidate
    - List all voters by election
    - List all voter by candidate
    - Get number of votes in election
    - Get number of votes by candidate
    - Get percentage competition between candidates
*/

@NearBindgen({})
class VotingNear {
  admins: string[] = []
  electionsCounterId: number = 0
  elections: UnorderedMap<Election> = new UnorderedMap<Election>("elections")
  candidates: UnorderedMap<Candidate[]> = new UnorderedMap<Candidate[]>("candidates")
  voters: UnorderedMap<Voter[]> = new UnorderedMap<Voter[]>("voters")

  @initialize({})
  init({ admins }: { admins: string[] }) {
    this.admins = admins
    this.electionsCounterId = 0
    near.log("Initializing contract...")
  }

  @view({})
  get_election({ electionId }: { electionId: number }): Election {
    return this.elections.get(String(electionId))
  }

  @view({})
  get_candidates_by_election({ electionId }: { electionId: number }): Candidate[] {
    return this.candidates.get(String(electionId))
  }

  @view({})
  get_voters_by_election({ electionId }: { electionId: number }): Voter[] {
    return this.voters.get(String(electionId))
  }

  @view({})
  get_voters_by_election_and_candidate({ electionId, candidateId }: { electionId: number, candidateId: string }): Voter[] {
    const allVoters = this.voters.get(String(electionId))

    const specificCandidateVoters = allVoters.filter((voter) => {
      return voter.votedCandidateAccountId === candidateId
    })

    return specificCandidateVoters
  }

  @call({})
  create_election({ endsAt, name, startsAt }: Election): void {
    const election = new Election(
      { 
        id: this.electionsCounterId,
        startsAt: BigInt(Number(startsAt) * 10 ** 6), 
        endsAt: BigInt(Number(endsAt) * 10 ** 6), 
        name, 
        candidates: [], 
        voters: [],
        totalVotes: 0 
      }
    )
    this.elections.set(String(this.electionsCounterId), election)
    this.electionsCounterId += 1

  }

  @call({})
  add_candidate_to_election({ accountId, electionId }: { accountId: string, electionId: number }): void {
    // TO-DO verify if is valid near account id
    const electionToAddCandidate = this.elections.get(String(electionId))
    // TO-DO Verify if election exist

    // TO-DO Verify if candidate already exists
    const candidate = new Candidate({ accountId, totalVotes: 0 })
    near.log("candidate =>", candidate)

    near.log("electionToAddCandidate.candidates =>", electionToAddCandidate.candidates)
    electionToAddCandidate.candidates.push(candidate)
    this.elections.set(String(electionId), electionToAddCandidate)

    const currentElectionCandidates = this.candidates.get(String(electionId))
    near.log("currentElectionCandidates =>", currentElectionCandidates)

    if (currentElectionCandidates === null) {
      this.candidates.set(String(electionId), [candidate])
    } else {
      currentElectionCandidates.push(candidate)
      this.candidates.set(String(electionId), currentElectionCandidates)
    }
  }

  @call({})
  vote({ electionId, candidateId }: { electionId: number, candidateId: string }): void {
    const election = this.elections.get(String(electionId))
    // TO-DO Verify if election exists
    // TO-DO Verify if election has started
    // TO-DO Verify if election has already ended

    const alreadyVoted = election.voters.includes(near.signerAccountId())
    near.log("election.voters", election.voters)

    near.log("alreadyVoted", alreadyVoted)
    assert(!alreadyVoted, "User has already voted. Reverting call.")

    const candidates = this.candidates.get(String(electionId))

    const candidate = candidates.filter((candidateFilter) => {
      return candidateFilter.accountId === candidateId
    })[0]

    // TO-DO Verify if candidate exists

    const voter = new Voter({ accountId: near.signerAccountId(), votedCandidateAccountId: candidate.accountId, votedAt: near.blockTimestamp() })
  

    // TO-DO Verify why election voters are not being updated
    // TO-DO Verify why election totalVotes are not being updated
    // TO-DO Verify why election candidates totalVotes are not being updated

    election.voters.push(voter.accountId)
    election.totalVotes += 1
    election.candidates.filter((candidateFilter) => {
      return candidateFilter.accountId === candidate.accountId
    })[0].totalVotes += 1
    this.elections.set(String(electionId), election)

    candidate.totalVotes += 1
    this.candidates.set(String(electionId), candidates)

    const voters = this.voters.get(String(electionId))
    
    if (voters === null) {
      this.voters.set(String(electionId), [voter])
    } else {
      voters.push(voter)
      this.voters.set(String(electionId), voters)
    }
  }
}