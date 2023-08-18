import axios from 'axios';
import React from 'react';
import { OGMeta, getOGMeta } from '../../../api/og_meta';
import { Card, Icon, Image } from 'semantic-ui-react';


interface Props {
    url: string;
}
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'];
const PreviewImage = (props: Props) => {
    const [meta, setMeta] = React.useState<OGMeta | undefined>(undefined); // [title, description, image
    const { url } = props;

    React.useEffect(() => {
        if (!url) {
            return;
        }
        if (IMAGE_EXTENSIONS.some((ext) => url.toLowerCase().endsWith(`.${ext}`))) {
            setMeta({
                title: url.split('/').pop() || '',
                description: '',
                image: url,
                site_name: '',
            });
            return;
        }
        getOGMeta(url).then((res) => {
            setMeta(res.data);
        }).catch((err) => {
            setMeta({});
        })
    }, [url]);

    if (!meta) {
        return <span><Icon name='spinner' loading /></span>;
    }else if (Object.keys(meta).length === 0) {
        return <span><Icon name='stop circle' color='red'  /></span>;
    }
    return (
        <Card
            image={meta.image}
            header={meta.title}
            meta={meta.site_name}
            description={meta.description}
        />
    )
}

export default PreviewImage;