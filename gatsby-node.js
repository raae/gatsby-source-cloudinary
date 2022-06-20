const { newCloudinary, getResourceOptions } = require('./utils');

const REPORTER_PREFIX = `gatsby-source-cloudinary`;
const NODE_TYPE = `CloudinaryMedia`;

let coreSupportsOnOluginInit = undefined;

try {
  const { isGatsbyNodeLifecycleSupported } = require(`gatsby-plugin-utils`);

  if (isGatsbyNodeLifecycleSupported(`onPluginInit`)) {
    coreSupportsOnOluginInit = 'stable';
  } else if (isGatsbyNodeLifecycleSupported(`unstable_onPluginInit`)) {
    coreSupportsOnOluginInit = 'unstable';
  }
} catch (error) {
  console.error(`Could not check if Gatsby supports onPluginInit lifecycle 🚴‍♀️`);
}

const globalPluginOptions = {};

const initializeGlobalState = (newCloudinary, getResourceOptions) => {
  // I a not sure if I am guessing right on how I am using newCloudinary && getResourceOptions
  // and how do I test if this works?
  const cloudinary = newCloudinary(options);
  const resourceOptions = getResourceOptions(options);

  return globalPluginOptions(cloudinary, resourceOptions);
};

if (coreSupportsOnOluginInit === 'stable') {
  exports.onPluginInit = initializeGlobalState;
} else if (coreSupportsOnOluginInit === 'unstable') {
  exports.unstable_onPluginInit = initializeGlobalState;
} else {
  exports.onPreBootstrap = initializeGlobalState;
}

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
