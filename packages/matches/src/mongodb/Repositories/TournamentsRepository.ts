import { Collection, type Db, type Document, type ObjectId } from 'mongodb';
import { type Tournament, TournamentSchema } from '../Models/Tournament.ts';
import { type Match, type MatchDTO, MatchSchema } from '../Models/Match.ts';
import { MatchesRepository } from './MatchesRepository.ts';

export class TournamentsRepository {
  public static readonly collectionName = 'tournaments';
  private readonly collection: Collection<Omit<Tournament, '_id'>>;

  public constructor(
    db: Db,
    private readonly matches: MatchesRepository,
  ) {
    this.collection = db.collection(TournamentsRepository.collectionName);
  }

  public async read(id: ObjectId): Promise<Tournament | null> {
    return this.collection.findOne({ _id: id });
  }

  /**
   * Read a tournament and join its matches
   */
  public async readBySlug(slug: string): Promise<TournamentWithMatches | null> {
    // Build an aggregation pipeline
    const pipeline: Document[] = [
      { $match: { slug } },
      {
        $lookup: {
          from: MatchesRepository.collectionName,
          let: { matchIds: '$matches' }, // keep original array (may contain duplicates)
          pipeline: [
            // Fetch only matches whose _id is in the provided list
            { $match: { $expr: { $in: ['$_id', '$$matchIds'] } } },
            // Tag each match with its order based on the tournament's matches
            { $addFields: { __order: { $indexOfArray: ['$$matchIds', '$_id'] } } },
            { $sort: { __order: 1 } },
            { $project: { __order: 0 } },
          ],
          as: 'matchesData',
        },
      },
    ];

    const rowUnknown = await this.collection.aggregate(pipeline).next();
    if (!rowUnknown) return null;

    // Validate the tournament
    const tournament = TournamentSchema.parse(rowUnknown);

    // Validate matches; skip invalid ones to keep the read tolerant.
    const matchesData = this.matches.toArrayDTO(
      Array.isArray((rowUnknown as { matchesData?: unknown[] }).matchesData)
        ? (rowUnknown as { matchesData: unknown[] }).matchesData
            .map((m) => MatchSchema.safeParse(m))
            .filter((r): r is { success: true; data: Match } => r.success)
            .map((r) => r.data)
        : [],
    );

    return { ...tournament, matchesData };
  }

  public async add(
    tournament: Omit<Tournament, '_id' | 'matches' | 'createdAt' | 'finishedAt' | 'aliases'>,
  ): Promise<ObjectId> {
    const id = await this.collection.insertOne({
      ...tournament,
      createdAt: new Date(),
      finishedAt: null,
      matches: [],
      aliases: {},
    });

    return id.insertedId;
  }

  public async addMatch(tournamentId: ObjectId, matchIds: ObjectId | ObjectId[]) {
    const ids = Array.isArray(matchIds) ? matchIds : [matchIds];

    await this.collection.updateOne(
      {
        _id: tournamentId,
      },
      {
        $addToSet: {
          matches: {
            $each: ids,
          },
        },
      },
    );
  }

  public async removeMatch(tournamentId: ObjectId, matchIds: ObjectId | ObjectId[]) {
    const ids = Array.isArray(matchIds) ? matchIds : [matchIds];

    await this.collection.updateOne(
      {
        _id: tournamentId,
      },
      {
        $pullAll: {
          matches: ids,
        },
      },
    );
  }
}

export type TournamentWithMatches = Tournament & { matchesData: MatchDTO[] };
