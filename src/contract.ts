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
  admins: string[]
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

  @call({})
  create_election({ endsAt, id, name, startsAt }: Election): void {
    const election = new Election({ startsAt, endsAt, name, id, candidates: [], totalVotes: 0, voters: [] })
    this.elections.set(String(id), election)
  }

  @call({})
  add_candidate_to_election({ accountId, electionId }: { accountId: string, electionId: number }): void {
    const electionToAddCandidate = this.elections.get(String(electionId))
    // TO-DO Verify if election exist
    
    // TO-DO Verify if candidate already exists
    const candidate = new Candidate({ accountId, totalVotes: 0 })
    electionToAddCandidate.candidates.push(candidate)
    this.elections.set(String(electionId), electionToAddCandidate)

    const currentElectionCandidates = this.candidates.get(String(electionId))
    currentElectionCandidates.push(candidate)
    this.candidates.set(String(electionId), currentElectionCandidates)
  }

  @call({})
  vote({ electionId, candidateId }: { electionId: number, candidateId: string }): void {
    const election = this.elections.get(String(electionId))
    // TO-DO Verify if election exists

    const alreadyVoted = election.voters.includes(near.signerAccountId())
    assert(!alreadyVoted, "User has already voted. Reverting call.")

    const candidates = this.candidates.get(String(electionId))
    const candidate = candidates.filter((candidateFilter) => {
      return candidateFilter.accountId === candidateId
    })[0]
    // TO-DO Verify if candidate exists

    const voter = new Voter({ accountId: near.signerAccountId(), votedCandidateAccountId: candidate.accountId, votedAt: near.blockTimestamp() })
  
    // add voter to VOTERS in electionId
    // incriment candidate totalVotes count
    // incriment election totalVotes count
    // add voter to election voters array
    election.voters.push(voter.accountId)
    election.totalVotes += 1
    this.elections.set(String(election), election)

    candidate.totalVotes += 1
    this.candidates.set(String(electionId), [...candidates, candidate])

    const voters = this.voters.get(String(electionId))
    voters.push(voter)
    this.voters.set(String(electionId), [voter])
  }
}