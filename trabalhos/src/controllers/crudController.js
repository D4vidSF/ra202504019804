module.exports = (service, resource) => ({
  list: async (req, res) => res.status(200).json(await service.list(req.query)),
  get: async (req, res) => res.status(200).json(await service.get(req.params.id)),
  create: async (req, res) => {
    const result = await service.create(req.body);
    res.location(`/${resource}/${result._id}`).status(201).json(result);
  },
  update: async (req, res) => res.status(200).json(await service.update(req.params.id, req.body)),
  remove: async (req, res) => {
    await service.remove(req.params.id);
    res.status(204).end();
  }
});
