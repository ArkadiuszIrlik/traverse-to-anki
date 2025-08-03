import { Prisma, PrismaClient, type Movie } from '@generated/prisma/client';

interface IMovieRepository {
  create: (data: Prisma.MovieCreateInput) => Promise<Movie>;
  findById: (id: Movie['id']) => Promise<Movie | null>;
}

class MovieRepository implements IMovieRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Prisma.MovieCreateInput) {
    const movie = await this.prisma.movie.create({ data });
    return movie;
  }

  async findById(id: Movie['id']) {
    const movie = await this.prisma.movie.findUnique({ where: { id } });
    return movie;
  }
}

const prismaClient = new PrismaClient();
const movieRepository = new MovieRepository(prismaClient);

export default movieRepository;
