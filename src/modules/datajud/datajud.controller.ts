import { FastifyRequest, FastifyReply } from 'fastify';
import { datajudService } from './datajud.service';
import { authenticate } from '../../middleware/authMiddleware';

interface SearchRequest extends FastifyRequest {
  query: {
    query: string;
    page?: number;
    limit?: number;
  };
}

interface GetCasesRequest extends FastifyRequest {
  query: {
    page?: number;
    limit?: number;
  };
}

interface GetCaseRequest extends FastifyRequest {
  params: {
    id: string;
  };
}

interface GetMagistrateRequest extends FastifyRequest {
  query: {
    id: string;
  };
}

export async function searchCases(request: SearchRequest, reply: FastifyReply) {
  try {
    const { query, page = 1, limit = 10 } = request.query;
    
    if (!query) {
      return reply.status(400).send({ error: 'Search query is required' });
    }
    
    const results = await datajudService.searchCases(query, page, limit);
    return reply.send(results);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
}

export async function getCases(request: GetCasesRequest, reply: FastifyReply) {
  try {
    const { page = 1, limit = 10 } = request.query;
    const cases = await datajudService.getCases(page, limit);
    return reply.send(cases);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
}

export async function getCaseById(request: GetCaseRequest, reply: FastifyReply) {
  try {
    const { id } = request.params;
    const caseDetails = await datajudService.getCaseById(id);
    return reply.send(caseDetails);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
}

export async function getCaseDocuments(request: GetCaseRequest, reply: FastifyReply) {
  try {
    const { id } = request.params;
    const documents = await datajudService.getCaseDocuments(id);
    return reply.send(documents);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
}

export async function getMagistrate(request: GetMagistrateRequest, reply: FastifyReply) {
  try {
    const { id } = request.query;
    
    if (!id) {
      return reply.status(400).send({ error: 'Magistrate ID is required' });
    }
    
    const magistrate = await datajudService.getMagistrateDetails(id);
    return reply.send(magistrate);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
}