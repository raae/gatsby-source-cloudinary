import * as React from 'react';
import { graphql } from 'gatsby';
import { GatsbyImage, getImage } from 'gatsby-plugin-image';

export default function IndexPage({ data }) {
  return (
    <main>
      {data.allCloudinaryMedia.nodes.map((media) => {
        const { secure_url } = media;
        const galaxyImage = getImage(media.galaxyImageData);
        const oceanImage = getImage(media.oceanImageData);
        return (
          <div style={{ margin: '1em' }}>
            <img width="300" src={secure_url} alt={'no alt :('} />
            <GatsbyImage image={galaxyImage} />
            <GatsbyImage image={oceanImage} />
          </div>
        );
      })}
    </main>
  );
}

export const query = graphql`
  query {
    allCloudinaryMedia {
      nodes {
        secure_url
        galaxyImageData: gatsbyImageData(
          width: 300
          transformations: ["c_fill", "e_background_removal"]
          chained: ["u_demo:galaxy,c_fill,w_1.0,h_1.0,fl_relative"]
          backgroundColor: "PaleTurquoise"
        )
        oceanImageData: gatsbyImageData(
          width: 300
          transformations: ["c_fill", "e_background_removal"]
          chained: ["u_demo:ocean,c_fill,w_1.0,h_1.0,fl_relative"]
          backgroundColor: "Lavender"
        )
      }
    }
  }
`;
