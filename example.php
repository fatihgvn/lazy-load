<?php

function lorem($count = 1, $max = 20, $standard = true) {
    $output = '';

    if ($standard) {
        $output = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, ' .
            'sed do eiusmod tempor incididunt ut labore et dolore magna ' .
            'aliqua.';
    }

    $pool = explode(
        ' ',
        'a ab ad accusamus adipisci alias aliquam amet animi aperiam ' .
        'architecto asperiores aspernatur assumenda at atque aut beatae ' .
        'blanditiis cillum commodi consequatur corporis corrupti culpa ' .
        'cum cupiditate debitis delectus deleniti deserunt dicta ' .
        'dignissimos distinctio dolor ducimus duis ea eaque earum eius ' .
        'eligendi enim eos error esse est eum eveniet ex excepteur ' .
        'exercitationem expedita explicabo facere facilis fugiat harum ' .
        'hic id illum impedit in incidunt ipsa iste itaque iure iusto ' .
        'laborum laudantium libero magnam maiores maxime minim minus ' .
        'modi molestiae mollitia nam natus necessitatibus nemo neque ' .
        'nesciunt nihil nisi nobis non nostrum nulla numquam occaecati ' .
        'odio officia omnis optio pariatur perferendis perspiciatis ' .
        'placeat porro possimus praesentium proident quae quia quibus ' .
        'quo ratione recusandae reiciendis rem repellat reprehenderit ' .
        'repudiandae rerum saepe sapiente sequi similique sint soluta ' .
        'suscipit tempora tenetur totam ut ullam unde vel veniam vero ' .
        'vitae voluptas'
    );

    $max = ($max <= 3) ? 4 : $max;
    $count = ($count < 1) ? 1 : (($count > 2147483646) ? 2147483646 : $count);

    for ($i = 0, $add = ($count - (int) $standard); $i < $add; $i++) {
        shuffle($pool);
        $words = array_slice($pool, 0, mt_rand(3, $max));
        $output .= ((! $standard && $i === 0) ? '' : ' ') . ucfirst(implode(' ', $words)) . '.';
    }

    return $output;
}


$json_data = [
    [
        "title" => lorem(1, 5, false),
        "content" => lorem(3)
    ],
    [
        "title" => lorem(1, 5, false),
        "content" => lorem(3)
    ],
    [
        "title" => lorem(1, 5, false),
        "content" => lorem(3)
    ],
    [
        "title" => lorem(1, 5, false),
        "content" => lorem(3)
    ],
    [
        "title" => lorem(1, 5, false),
        "content" => lorem(3)
    ],
    [
        "title" => lorem(1, 5, false),
        "content" => lorem(3)
    ],
    [
        "title" => lorem(1, 5, false),
        "content" => lorem(3)
    ],
    [
        "title" => lorem(1, 5, false),
        "content" => lorem(3)
    ],
    [
        "title" => lorem(1, 5, false),
        "content" => lorem(3)
    ],
    [
        "title" => lorem(1, 5, false),
        "content" => lorem(3)
    ]
];


header('Content-Type: application/json; charset=utf-8');
echo json_encode($json_data);