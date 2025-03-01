const {
  newCloudinary,
  getResourceOptions,
  generateCloudinaryUrl,
} = require('./utils');

const REPORTER_PREFIX = `gatsby-source-cloudinary`;
const NODE_TYPE = `CloudinaryMedia`;

exports.pluginOptionsSchema = ({ Joi }) => {
  return Joi.object({
    cloudName: Joi.string().required(),
    apiKey: Joi.string().required(),
    apiSecret: Joi.string().required(),
    resourceType: Joi.string().default('image'),
    type: Joi.string(),
    maxResults: Joi.number().integer().positive().default(10),
    resultsPerPage: Joi.number()
      .integer()
      .positive()
      .default(Joi.ref('maxResults')),
    tags: Joi.boolean().default(false),
    prefix: Joi.string(),
    context: Joi.boolean(),
  });
};

const getNodeData = (gatsbyUtils, media, cloudName) => {
  const { createNodeId, createContentDigest } = gatsbyUtils;

  const url = generateCloudinaryUrl(media, {
    secure: false,
  });
  const secureUrl = generateCloudinaryUrl(media, {
    secure: true,
  });

  return {
    // Keep all original data around,
    // keep for backwards compatability.
    // Remove in favour of `cloudinaryData: media`,
    // when next breaking change is released
    ...media,
    // ID
    id: createNodeId(`cloudinary-media-${media.public_id}`),
    // Needed by gatsby-transformer-cloudinary
    cloudName: cloudName,
    publicId: media.public_id,
    originalHeight: media.height,
    originalWidth: media.width,
    originalFormat: media.format,
    // Keep all original data around
    cloudinaryData: media,
    // Generated urls
    url: url,
    secure_url: secureUrl,
    // Internal
    internal: {
      type: NODE_TYPE,
      content: JSON.stringify(media),
      contentDigest: createContentDigest(media),
    },
  };
};

const createCloudinaryNodes = async (
  gatsbyUtils,
  cloudinary,
  resourceOptions,
  cloudName,
) => {
  const { actions, reporter } = gatsbyUtils;
  const { max_results, results_per_page } = resourceOptions;

  let nextCursor = null;
  let limit = max_results;
  let resultsPerPage = results_per_page;

  do {
    try {
      const result = await cloudinary.api.resources({
        ...resourceOptions,
        max_results: limit < resultsPerPage ? limit : resultsPerPage,
        next_cursor: nextCursor,
      });

      result.resources.forEach((resource) => {
        const nodeData = getNodeData(gatsbyUtils, resource, cloudName);
        actions.createNode(nodeData);
      });

      if (result.resources.length === 0) {
        reporter.warn(
          `${REPORTER_PREFIX}: No Cloudinary resources found. Try a different query?`,
        );
      } else {
        reporter.info(
          `${REPORTER_PREFIX}: Added ${result.resources.length} ${NODE_TYPE} nodes(s)`,
        );
      }

      nextCursor = result.next_cursor;
      limit = limit - result.resources.length;
    } catch (error) {
      reporter.error(
        `${REPORTER_PREFIX}: Fetching Cloudinary resources failed.`,
        error.error || error,
      );
    }
  } while (nextCursor && limit > 0);
};

exports.sourceNodes = async (gatsbyUtils, pluginOptions) => {
  const { cloudName } = pluginOptions;
  const cloudinary = newCloudinary(pluginOptions);
  const resourceOptions = getResourceOptions(pluginOptions);

  await createCloudinaryNodes(
    gatsbyUtils,
    cloudinary,
    resourceOptions,
    cloudName,
  );
};
