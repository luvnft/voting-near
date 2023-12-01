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

  **IDEAS
      near deploy --accountId your-account-id --wasmFile out/main.wasm --initFunction init --initArgs '{"admins": [""]}'
    - Only admnins can add candidate
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
        startsAt: BigInt(Number(startsAt) * 10 ** 6), //Converting javascript milliseconds to near blockchain standard nanoseconds
        endsAt: BigInt(Number(endsAt) * 10 ** 6), //Converting javascript milliseconds to near blockchain standard nanoseconds
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
    const electionToAddCandidate = this.elections.get(String(electionId))
    const electionExists = this.verifyElectionExistence(electionId)
    assert(electionExists, "Election not found.")

    const electionIsHappening = this.verifyElectionIsHappening(electionId)
    assert(electionIsHappening, "Election has not started or has already been finished.")

    const candidateAlreadyExists = this.verifyCandidateExistence(accountId, electionId)
    assert(!candidateAlreadyExists, "Candidate already exists. Reverting call.")

    const candidate = new Candidate({ accountId, totalVotes: 0 })

    electionToAddCandidate.candidates.push(candidate)
    this.elections.set(String(electionId), electionToAddCandidate)

    const currentElectionCandidates = this.candidates.get(String(electionId))

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
    assert(election !== null, "Election not found.")

    const electionIsHappening = this.verifyElectionIsHappening(electionId)
    assert(electionIsHappening, "Election has not started or has already been finished.")

    const alreadyVoted = election.voters.includes(near.signerAccountId())

    near.log("alreadyVoted", alreadyVoted)
    assert(!alreadyVoted, "User has already voted. Reverting call.")

    const candidates = this.candidates.get(String(electionId))

    const candidate = candidates.filter((candidateFilter) => {
      return candidateFilter.accountId === candidateId
    })[0]

    assert(typeof candidate !== 'undefined', "Candidate not found. Reverting call.")

    const voter = new Voter({ accountId: near.signerAccountId(), votedCandidateAccountId: candidate.accountId, votedAt: near.blockTimestamp() })

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

  verifyElectionExistence(electionId: number): boolean {
    const election = this.elections.get(String(electionId))
    const exists = election !== null

    return exists
  }

  verifyElectionIsHappening(electionId: number): boolean {
    const election = this.elections.get(String(electionId))

    const now = near.blockTimestamp()
    near.log("now", now)

    const isHappening = election.startsAt < now && election.endsAt > now
    near.log("isHappening", isHappening)

    return isHappening
  }

  verifyCandidateExistence(candidateId: string, electionId: number): boolean {
    const candidates = this.candidates.get(String(electionId))

    if (candidates === null) {
      return false
    } else {
      const candidate = candidates.filter((candidateFilter) => {
        return candidateFilter.accountId === candidateId
      })
      
      const exists = candidate.length > 0
  
      return exists
    }
  }
}

