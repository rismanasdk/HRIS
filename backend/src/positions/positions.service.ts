import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from '../database/entities/position.entity.js';
import { CreatePositionDto } from './dto/create-position.dto.js';
import { UpdatePositionDto } from './dto/update-position.dto.js';

type PositionTreeNode = Pick<
  Position,
  'id' | 'title' | 'department' | 'parentId'
> & { children: PositionTreeNode[] };

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private readonly positionsRepository: Repository<Position>,
  ) {}

  async findAll(format?: string) {
    const positions = await this.positionsRepository.find({
      order: { id: 'ASC' },
    });

    if (format === 'flat') {
      return positions;
    }

    const nodes: PositionTreeNode[] = positions.map((position) => ({
      id: position.id,
      title: position.title,
      department: position.department,
      parentId: position.parentId,
      children: [],
    }));
    const nodesById = new Map(nodes.map((position) => [position.id, position]));
    const roots: typeof nodes = [];

    for (const position of nodes) {
      if (position.parentId === null) {
        roots.push(position);
      } else {
        const parent = nodesById.get(position.parentId);
        if (parent) {
          parent.children.push(position);
        } else {
          // Orphan records are included as roots instead of disappearing.
          roots.push(position);
        }
      }
    }

    return roots;
  }

  async create(dto: CreatePositionDto): Promise<Position> {
    const parent =
      dto.parentId == null
        ? null
        : await this.findParent(dto.parentId);
    const position = this.positionsRepository.create({
      title: dto.title,
      department: dto.department ?? null,
      parentId: parent?.id ?? null,
      parent,
    });
    return this.positionsRepository.save(position);
  }

  async update(id: number, dto: UpdatePositionDto): Promise<Position> {
    const position = await this.positionsRepository.findOneBy({ id });
    if (!position) {
      throw new NotFoundException(`Position ${id} not found`);
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('A position cannot be its own parent');
      }
      const parent =
        dto.parentId === null ? null : await this.findParent(dto.parentId);
      position.parent = parent;
      position.parentId = parent?.id ?? null;
    }

    if (dto.title !== undefined) position.title = dto.title;
    if (dto.department !== undefined) position.department = dto.department;

    return this.positionsRepository.save(position);
  }

  async remove(id: number): Promise<void> {
    const result = await this.positionsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Position ${id} not found`);
    }
  }

  private async findParent(id: number): Promise<Position> {
    const parent = await this.positionsRepository.findOneBy({ id });
    if (!parent) {
      throw new NotFoundException(`Parent position ${id} not found`);
    }
    return parent;
  }
}