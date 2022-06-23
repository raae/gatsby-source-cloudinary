const { newCloudinary, getResourceOptions } = require('./utils');

const REPORTER_PREFIX = `gatsby-source-cloudinary`;
const NODE_TYPE = `CloudinaryMedia`;

exports.pluginOptionsSchema = ({ Joi }) => {
  return Joi.object({
    cloudName: Joi.string().required(),
    apiKey: Joi.string().required(),
    apiSecret: Joi.string().required(),
    resourceType: Joi.string().default('image'),
    type: Joi.string().default('all'),
    maxResults: Joi.integer().default(10),
    tags: Joi.boolean().default(false),
    prefix: Joi.string(),
    context: Joi.boolean(),
  });
};
// yes

const getNodeData = (gatsbyUtils, media) => {
  const { createNodeId, createContentDigest } = gatsbyUtils;

  return {
    ...media,
    id: createNodeId(`cloudinary-media-${media.public_id}`),
    parent: null,
    internal: {
      type: NODE_TYPE,
      content: JSON.stringify(media),
      contentDigest: createContentDigest(media),
    },
  };
};

const addTransformations = (resource, transformation, secure) => {
  const splitURL = secure
    ? resource.secure_url.split('/')
    : resource.url.split('/');
  splitURL.splice(6, 0, transformation);

  const transformedURL = splitURL.join('/');
  return transformedURL;
};

const createCloudinaryNodes = (gatsbyUtils, cloudinary, resourceOptions) => {
  const { actions, reporter } = gatsbyUtils;

  return cloudinary.api.resources(resourceOptions, (error, result) => {
    const hasResources = result && result.resources && result.resources.length;

    if (error) {
      reporter.error(
        `${REPORTER_PREFIX}: Error fetching Cloudinary resources - ${error.message}`,
      );
      return;
    }

    if (!hasResources) {
      reporter.warn(
        `${REPORTER_PREFIX}: No Cloudinary resources found. Try a different query?`,
      );
      return;
    }

    result.resources.forEach((resource) => {
      const transformations = 'q_auto,f_auto'; // Default CL transformations, todo: fetch base transformations from config maybe.

      resource.url = addTransformations(resource, transformations);
      resource.secure_url = addTransformations(resource, transformations, true);

      const nodeData = getNodeData(gatsbyUtils, resource);
      actions.createNode(nodeData);
    });

    reporter.info(
      `${REPORTER_PREFIX}: Added ${hasResources} ${NODE_TYPE} nodes(s)`,
    );
  });
};

exports.sourceNodes = (gatsbyUtils, pluginOptions) => {
  const cloudinary = newCloudinary(pluginOptions);
  const resourceOptions = getResourceOptions(pluginOptions);

  return createCloudinaryNodes(gatsbyUtils, cloudinary, resourceOptions);
};
