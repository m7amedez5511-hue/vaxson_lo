export class PrismaFeatures {
  constructor(model, queryString) {
    this.model = model;
    this.queryString = queryString;

    this.queryOptions = {
      where: {},
    };
  }

  //  SEARCH (OR)
  search(fields = []) {
    if (this.queryString.search) {
      this.queryOptions.where.OR = fields.map((field) => ({
        [field]: {
          contains: this.queryString.search,
          mode: "insensitive",
        },
      }));
    }

    return this;
  }

  //  FILTERS (exact match) — allowlist only
  // Pass an array of permitted field names; only those keys from the query
  // string are applied to `where`. Everything else is silently ignored,
  // preventing arbitrary field injection (e.g. ?roleId=, ?isDeleted=, ?password=).
  filter(allowedFields = []) {
    const systemFields = ["page", "limit", "sort", "search"];

    const filters = {};

    // Only pick keys that are explicitly allowed by the caller
    for (const key of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(this.queryString, key) &&
        !systemFields.includes(key)
      ) {
        let value = this.queryString[key];

        // Coerce boolean strings
        if (value === "true") value = true;
        else if (value === "false") value = false;

        filters[key] = value;
      }
    }

    this.queryOptions.where = {
      ...this.queryOptions.where,
      ...filters,
    };

    return this;
  }

  // Apply a selector to the query.
  // - If `includeMap` is provided, scalar fields go into `select` and
  //   relations go into `include` (Prisma forbids mixing both in one object).
  // - If only `selectMap` is given it is used as a plain `select`.
  selectOrInclude(selectMap, includeMap = null) {
    if (includeMap) {
      this.queryOptions.select = selectMap;
      this.queryOptions.include = includeMap;
    } else {
      this.queryOptions.select = selectMap;
    }
    return this;
  }

  //  SORT — allowlist only
  // Pass an array of permitted field names. Any field not in the list is
  // silently dropped; if the remaining sort is empty the default
  // (createdAt desc) is used. This prevents Prisma 500s from unknown fields
  // and stops clients from probing the schema via error messages.
  sort(allowedFields = []) {
    if (this.queryString.sort) {
      const orderBy = this.queryString.sort
        .split(",")
        .map((field) => {
          const isDesc = field.startsWith("-");
          const name = isDesc ? field.slice(1) : field;

          // Drop any field not in the allowlist
          if (allowedFields.length > 0 && !allowedFields.includes(name)) {
            return null;
          }

          return { [name]: isDesc ? "desc" : "asc" };
        })
        .filter(Boolean); // remove nulls from rejected fields

      // Fall back to default if everything was stripped
      this.queryOptions.orderBy =
        orderBy.length > 0 ? orderBy : { createdAt: "desc" };
    } else {
      this.queryOptions.orderBy = {
        createdAt: "desc",
      };
    }

    return this;
  }

  //  PAGINATION
  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 10;

    const skip = (page - 1) * limit;

    this.queryOptions.skip = skip;
    this.queryOptions.take = limit;

    return this;
  }

  //  EXECUTE QUERY
  async exec() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 10;

    const [data, total] = await Promise.all([
      this.model.findMany(this.queryOptions),
      this.model.count({ where: this.queryOptions.where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}