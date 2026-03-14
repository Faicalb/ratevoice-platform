import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForBusiness(filters?: { city?: string; country?: string; type?: 'news' | 'event' }) {
    const city = filters?.city?.trim();
    const country = filters?.country?.trim();

    const whereBase: any = { status: 'PUBLISHED' };
    if (city) whereBase.city = { equals: city, mode: 'insensitive' };
    if (country) whereBase.country = { equals: country, mode: 'insensitive' };

    const [events, news] = await Promise.all([
      filters?.type === 'news'
        ? Promise.resolve([])
        : this.prisma.event.findMany({ where: whereBase, orderBy: { createdAt: 'desc' }, take: 100 }),
      filters?.type === 'event'
        ? Promise.resolve([])
        : this.prisma.news.findMany({ where: whereBase, orderBy: { createdAt: 'desc' }, take: 100 })
    ]);

    const mapped = [
      ...events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        city: e.city || '',
        country: e.country || '',
        category: e.category || '',
        imageUrl: e.imageUrl || null,
        source: e.source || null,
        eventDate: e.eventDate ? e.eventDate.toISOString() : null,
        isEvent: true,
        isNews: false,
        createdAt: e.createdAt.toISOString(),
        status: e.status.toLowerCase()
      })),
      ...news.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        city: n.city || '',
        country: n.country || '',
        category: n.category || '',
        imageUrl: n.imageUrl || null,
        source: n.source || null,
        eventDate: null,
        isEvent: false,
        isNews: true,
        createdAt: n.createdAt.toISOString(),
        status: n.status.toLowerCase()
      }))
    ];

    return mapped.sort((a, b) => {
      const aEvent = a.isEvent && a.eventDate ? new Date(a.eventDate).getTime() : null;
      const bEvent = b.isEvent && b.eventDate ? new Date(b.eventDate).getTime() : null;
      if (aEvent !== null && bEvent !== null) return aEvent - bEvent;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async adminListEvents(skip = 0, take = 50) {
    return this.prisma.event.findMany({ skip, take, orderBy: { createdAt: 'desc' } });
  }

  async adminListNews(skip = 0, take = 50) {
    return this.prisma.news.findMany({ skip, take, orderBy: { createdAt: 'desc' } });
  }

  async adminCreateEvent(adminId: string, data: any) {
    const eventDate = data.eventDate ? new Date(data.eventDate) : null;
    const created = await this.prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        city: data.city || null,
        country: data.country || null,
        category: data.category || null,
        imageUrl: data.imageUrl || null,
        source: data.source || null,
        eventDate,
        status: data.status || 'PUBLISHED',
        createdByAdminId: adminId
      }
    });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'ADMIN_EVENT_CREATE', resource: 'EVENT', details: { eventId: created.id } }
    });
    return created;
  }

  async adminCreateNews(adminId: string, data: any) {
    const created = await this.prisma.news.create({
      data: {
        title: data.title,
        description: data.description,
        city: data.city || null,
        country: data.country || null,
        category: data.category || null,
        imageUrl: data.imageUrl || null,
        source: data.source || null,
        status: data.status || 'PUBLISHED',
        createdByAdminId: adminId
      }
    });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'ADMIN_NEWS_CREATE', resource: 'NEWS', details: { newsId: created.id } }
    });
    return created;
  }

  async adminUpdateEventStatus(adminId: string, eventId: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') {
    const updated = await this.prisma.event.update({ where: { id: eventId }, data: { status } });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'ADMIN_EVENT_STATUS', resource: 'EVENT', details: { eventId, status } }
    });
    return updated;
  }

  async adminUpdateNewsStatus(adminId: string, newsId: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') {
    const updated = await this.prisma.news.update({ where: { id: newsId }, data: { status } });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'ADMIN_NEWS_STATUS', resource: 'NEWS', details: { newsId, status } }
    });
    return updated;
  }

  async adminDeleteEvent(adminId: string, eventId: string) {
    await this.prisma.event.delete({ where: { id: eventId } });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'ADMIN_EVENT_DELETE', resource: 'EVENT', details: { eventId } }
    });
    return { success: true };
  }

  async adminDeleteNews(adminId: string, newsId: string) {
    await this.prisma.news.delete({ where: { id: newsId } });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'ADMIN_NEWS_DELETE', resource: 'NEWS', details: { newsId } }
    });
    return { success: true };
  }

  async businessCreate(ownerId: string, data: any) {
    const business = await this.prisma.business.findFirst({ where: { ownerId }, include: { branches: true } });
    if (!business) throw new Error('Business not found');
    const city = data.city || business.branches?.[0]?.city || null;
    const country = data.country || business.branches?.[0]?.country || null;

    const isEvent = !!data.isEvent || !!data.eventDate;
    if (isEvent) {
      const created = await this.prisma.event.create({
        data: {
          title: data.title,
          description: data.description,
          city,
          country,
          category: data.category || null,
          imageUrl: data.imageUrl || null,
          source: data.source || business.name,
          eventDate: data.eventDate ? new Date(data.eventDate) : null,
          status: 'DRAFT',
          createdByBusinessId: business.id
        }
      });
      await this.prisma.auditLog.create({
        data: { userId: ownerId, action: 'BUSINESS_EVENT_SUBMIT', resource: 'EVENT', details: { eventId: created.id, businessId: business.id } }
      });
      return created;
    }

    const created = await this.prisma.news.create({
      data: {
        title: data.title,
        description: data.description,
        city,
        country,
        category: data.category || null,
        imageUrl: data.imageUrl || null,
        source: data.source || business.name,
        status: 'DRAFT',
        createdByBusinessId: business.id
      }
    });
    await this.prisma.auditLog.create({
      data: { userId: ownerId, action: 'BUSINESS_NEWS_SUBMIT', resource: 'NEWS', details: { newsId: created.id, businessId: business.id } }
    });
    return created;
  }
}
